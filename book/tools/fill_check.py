"""Finds pages whose body area is mostly empty (ignores margin boxes). Usage: python3 tools/fill_check.py [threshold]"""
import glob,sys,json
from PIL import Image
thr=float(sys.argv[1]) if len(sys.argv)>1 else 0.30
files=sorted(glob.glob('build/png/p-*.png'))
out=[]
for i,f in enumerate(files,1):
    im=Image.open(f).convert('L'); w,h=im.size; mm=h/297
    top=int(22*mm); bot=int((297-23)*mm)
    px=im.load(); last=top
    for y in range(bot,top,-1):
        row=[px[x,y] for x in range(int(18*mm),int(w-18*mm),2)]
        if min(row)<200: last=y;break
    fill=(last-top)/(bot-top); out.append((i,round(fill,2)))
low=[(i,fl) for i,fl in out if fl<thr]
print('pages',len(out),'low-fill pages (<%.2f):'%thr,len(low)); print(low)
json.dump(out,open('build/fill.json','w'))
