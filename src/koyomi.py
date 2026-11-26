import ephem, math, json, datetime as dt
JST=dt.timedelta(hours=9)
def jstdate(d): return (ephem.Date(d).datetime()+JST).date()
def sunlon(d):
    s=ephem.Sun(); s.compute(d, epoch=d)
    return math.degrees(ephem.Ecliptic(s, epoch=d).lon)%360
def find_term(start, target):
    # step daily to find crossing, then bisect
    d=ephem.Date(start)
    def diff(x): return ((sunlon(x)-target+180)%360)-180
    while diff(d)>=0: d=ephem.Date(d+1)  # move until behind? ensure we are before
    while diff(d)<0: d=ephem.Date(d+1)
    a,b=ephem.Date(d-1),d
    for _ in range(40):
        m=ephem.Date((a+b)/2)
        if diff(m)<0: a=m
        else: b=m
    return b
names=['春分','清明','穀雨','立夏','小満','芒種','夏至','小暑','大暑','立秋','処暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒','立春','雨水','啓蟄']
terms=[]
d=ephem.Date('2023/1/1')
# start at 冬至 2022 approx
lon0=int(sunlon(d)//15)*15
t=d
L=(lon0+15)%360
while True:
    t=find_term(ephem.Date(t+1) if terms else t, L)
    dd=jstdate(t)
    if dd.year>2041: break
    terms.append((dd, L))
    L=(L+15)%360
# new moons
nms=[]
n=ephem.next_new_moon('2022/11/1')
while True:
    dd=jstdate(n)
    if dd.year>2041: break
    nms.append(dd); n=ephem.next_new_moon(ephem.Date(n+1))
zmap={270:11,300:12,330:1,0:2,30:3,60:4,90:5,120:6,150:7,180:8,210:9,240:10}
months=[]
prev=None
for i in range(len(nms)-1):
    a,b=nms[i],nms[i+1]
    z=[L for (dd,L) in terms if a<=dd<b and L%30==0]
    if z: m=zmap[z[0]]; leap=0
    else: m=prev; leap=1
    months.append((a,m,leap)); prev=m
ep=dt.date(1970,1,1)
months=[m for m in months if m[0].year>=2023 and m[1] is not None]
out={'m':[[ (a-ep).days, m, l] for a,m,l in months],
     't':[[ (d-ep).days, names[[0,15,30,45,60,75,90,105,120,135,150,165,180,195,210,225,240,255,270,285,300,315,330,345].index(L)]] for d,L in terms if d.year>=2023]}
json.dump(out,open('koyomi.json','w'),ensure_ascii=False,separators=(',',':'))
# checks
for a,m,l in months:
    if a.year==2026 or (a.year==2027 and a.month<3): print(a,m,l)
print([ (str(d),n) for d,n in [(dt.date(1970,1,1)+dt.timedelta(x),n) for x,n in out['t']] if d.year==2026][:6])
