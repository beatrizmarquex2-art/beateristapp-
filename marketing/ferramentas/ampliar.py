import sys,numpy as np,onnxruntime as ort
from PIL import Image
so=ort.SessionOptions(); so.log_severity_level=3; s=ort.InferenceSession(sys.argv[1],so,providers=['CPUExecutionProvider'])
for a,b in zip(sys.argv[2::2],sys.argv[3::2]):
    im=np.asarray(Image.open(a).convert('RGB'),np.float32)/255; x=np.pad(im,((8,8),(8,8),(0,0)),mode='reflect').transpose(2,0,1)[None]
    y=s.run(None,{'in':x})[0][0].transpose(1,2,0)[32:-32,32:-32]; Image.fromarray((np.clip(y,0,1)*255+.5).astype(np.uint8)).save(b); print(b,y.shape)
