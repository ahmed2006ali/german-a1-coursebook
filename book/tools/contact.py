import sys,glob
from PIL import Image
files=sorted(glob.glob('build/png/p-*.png'))
start,count,cols=int(sys.argv[1]),int(sys.argv[2]),int(sys.argv[3])
sel=files[start-1:start-1+count]
im0=Image.open(sel[0]); w,h=im0.size; s=0.62; tw,th=int(w*s),int(h*s)
rows=(len(sel)+cols-1)//cols
sheet=Image.new('RGB',(cols*(tw+8)+8,rows*(th+8)+8),(120,120,120))
for i,f in enumerate(sel):
    im=Image.open(f).convert('RGB').resize((tw,th),Image.LANCZOS)
    sheet.paste(im,(8+(i%cols)*(tw+8),8+(i//cols)*(th+8)))
sheet.save(sys.argv[4]); print(sheet.size)
