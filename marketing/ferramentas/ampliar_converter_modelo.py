# converte os pesos do Real-ESRGAN anime 6B (.pth) pra ONNX sem precisar do torch
import zipfile,pickle,numpy as np,onnx,sys
from onnx import helper as H, TensorProto as TP, numpy_helper as NH
z=zipfile.ZipFile(sys.argv[1]); root=[n for n in z.namelist() if n.endswith('data.pkl')][0][:-8]
class St:
    def __init__(s,dt): s.dt=dt
def rebuild(storage,off,size,stride,*a):
    arr=np.frombuffer(storage,dtype=np.float32); n=int(np.prod(size)) if size else 1
    return arr[off:off+n].reshape(size).copy()
class U(pickle.Unpickler):
    def find_class(s,m,n):
        if n=='_rebuild_tensor_v2': return rebuild
        if n=='FloatStorage': return 'f'
        if n=='OrderedDict': import collections; return collections.OrderedDict
        return super().find_class(m,n)
    def persistent_load(s,pid): return z.read(root+'data/'+pid[2])
sd=U(z.open(root+'data.pkl')).load(); sd=sd.get('params_ema',sd.get('params',sd)); print(len(sd),list(sd)[:3])
nodes=[];inits=[];c=[0]
def nm(): c[0]+=1; return f't{c[0]}'
def conv(x,key):
    inits.append(NH.from_array(sd[key+'.weight'],key+'.w')); inits.append(NH.from_array(sd[key+'.bias'],key+'.b')); o=nm()
    nodes.append(H.make_node('Conv',[x,key+'.w',key+'.b'],[o],pads=[1,1,1,1])); return o
def lrelu(x): o=nm(); nodes.append(H.make_node('LeakyRelu',[x],[o],alpha=0.2)); return o
def cat(xs): o=nm(); nodes.append(H.make_node('Concat',xs,[o],axis=1)); return o
inits.append(NH.from_array(np.array(0.2,np.float32),'k02')); inits.append(NH.from_array(np.array([1,1,2,2],np.float32),'sc2'))
def sadd(x,y): m=nm(); nodes.append(H.make_node('Mul',[y,'k02'],[m])); o=nm(); nodes.append(H.make_node('Add',[x,m],[o])); return o
def up(x): o=nm(); nodes.append(H.make_node('Resize',[x,'','sc2'],[o],mode='nearest')); return o
def rdb(x,k):
    x1=lrelu(conv(x,k+'.conv1')); x2=lrelu(conv(cat([x,x1]),k+'.conv2')); x3=lrelu(conv(cat([x,x1,x2]),k+'.conv3')); x4=lrelu(conv(cat([x,x1,x2,x3]),k+'.conv4')); x5=conv(cat([x,x1,x2,x3,x4]),k+'.conv5'); return sadd(x,x5)
f=conv('in','conv_first'); b=f
nb=len({k.split('.')[1] for k in sd if k.startswith('body.')})
for i in range(nb):
    y=b
    for j in (1,2,3): y=rdb(y,f'body.{i}.rdb{j}')
    b=sadd(b,y)
bb=conv(b,'conv_body'); o=nm(); nodes.append(H.make_node('Add',[f,bb],[o])); x=o
x=lrelu(conv(up(x),'conv_up1')); x=lrelu(conv(up(x),'conv_up2')); x=conv(lrelu(conv(x,'conv_hr')),'conv_last')
nodes.append(H.make_node('Identity',[x],['out']))
g=H.make_graph(nodes,'esr',[H.make_tensor_value_info('in',TP.FLOAT,[1,3,'h','w'])],[H.make_tensor_value_info('out',TP.FLOAT,[1,3,'H','W'])],inits)
m=H.make_model(g,opset_imports=[H.make_opsetid('',13)]); m.ir_version=8; onnx.save(m,sys.argv[2]); print('blocos',nb)
