from pptx import Presentation
import re, json
p=Presentation('/mnt/project-files/bootin/sekkeizu/BOOTIN_柱の整理.pptx')
order=['私と家族','健康','生活管理','交友・アドレス','店・利用施設','おたのしみ','NEWS・知識','ビジネス','設定・機能']
reds={n:{'name':n,'blue':[]} for n in order}
def fill(sh):
    try:
        if sh.fill.type==1: return str(sh.fill.fore_color.rgb)
    except: pass
def inside(a,b): # a's left within b's horizontal span
    return b.left-200000 <= a.left <= b.left+b.width
for s in list(p.slides)[3:19]:
    shapes=[sh for sh in s.shapes if sh.has_text_frame]
    title=re.sub('[①②③]','',shapes[0].text_frame.text.strip())
    red=reds[title]
    blues=[sh for sh in shapes if fill(sh)=='BDD7EE']
    yels=[sh for sh in shapes if fill(sh)=='FFC000']
    texts=[sh for sh in shapes[1:] if fill(sh) is None and sh.text_frame.text.strip().startswith('・')]
    def owner(sh, cands):
        c=[b for b in cands if inside(sh,b) and b.top<sh.top]
        return max(c,key=lambda b:b.top) if c else None
    bmap={}
    for b in sorted(blues,key=lambda b:(b.top,b.left)):
        name=b.text_frame.text.strip().replace('（つづき）','')
        blue=next((x for x in red['blue'] if x['name']==name),None)
        if not blue: blue={'name':name,'yel':[]}; red['blue'].append(blue)
        bmap[b.shape_id]=blue
    ymap={}
    for y in sorted(yels,key=lambda y:(y.left//3000000,y.top)):
        b=owner(y,blues); blue=bmap[b.shape_id]
        yy={'name':y.text_frame.text.strip(),'items':[]}; blue['yel'].append(yy); ymap[y.shape_id]=yy
    for t in sorted(texts,key=lambda t:(t.left//3000000,t.top)):
        y=owner(t,yels); b=owner(t,blues)
        if y is not None and (b is None or y.top>b.top): yy=ymap[y.shape_id]
        else:
            blue=bmap[b.shape_id]
            yy=next((x for x in blue['yel'] if x['name']==blue['name']),None)
            if not yy: yy={'name':blue['name'],'items':[]}; blue['yel'].insert(0,yy)
        for line in t.text_frame.text.split('\n'):
            line=line.strip().lstrip('・').strip()
            m=re.search(r'\s*(AA|BB|CC)(★★|♠♠|♥♥)\s*$',line)
            if m: yy['items'].append([line[:m.start()],m.group(1),m.group(2)])
            elif line: yy['items'].append([line,'',''])
out=[reds[n] for n in order]
n=0
for r in out:
    print(r['name'])
    for b in r['blue']:
        print('  ',b['name'],'|',', '.join(f"{y['name']}({len(y['items'])})" for y in b['yel']))
        n+=sum(len(y['items']) for y in b['yel'])
print(n)
json.dump(out,open('tree.json','w'),ensure_ascii=False)
