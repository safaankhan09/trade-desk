import sys; sys.path.insert(0,'.')
import pandas as pd, bt
from bt import T
from multiprocessing import Pool
SY=["NQ","ES","YM","GC","SI"]
D={s:pd.read_pickle(f"data/{s}.pkl") for s in SY}
BASE=dict(  # v3 defaults
          model="FVG",level="edge",stop="zone",tp=500,min_rr=2.0,windows=((T(9,30),T(11,30)),),use_swings=False,
          reclaim=True,entry="limit",sweep_expiry=40,risk=250,max_trades=3,stop_on_win=False,use_nyam=False)
V=[("base",{})]
for k,vals in dict(sweep_expiry=[20,30,60],min_rr=[1.5,2.5,3.0],tp=[400,600],risk=[200,300],level=["ce"],stop=["sweep"],
   use_swings=[True],buf=[2,8],min_fvg_ticks=[2,8],limit_expiry=[5,20],max_trades=[1,2],stop_on_win=[True],through=[0],
   model=["Both"],entry=["market"]).items():
    for v in vals: V.append((f"{k}={v}",{k:v}))
V.append(("win=AM+PM",dict(windows=((T(9,30),T(11,30)),(T(13,30),T(15,45))),use_nyam=True)))
V.append(("win=0930-1100",dict(windows=((T(9,30),T(11)),))))
V.append(("win=LON+AM",dict(windows=((T(3),T(5)),(T(9,30),T(11,30))))))
def ev(item):
    name,ch=item; cfg=dict(BASE); cfg.update(ch); row={"var":name}; tot=0;n=0;bl=0
    for s in SY:
        tr,eq,b=bt.run(D[s],s,**cfg); st=bt.stats(tr,eq,b); row[s]=f"{int(st['net']):>6} ({st['n']},pf{st['pf']},dd{int(st['mdd'])})"; tot+=st['net']; n+=st['n']; bl+=st['blown']
    row["TOTAL"]=int(tot); row["n"]=n; row["blown"]=bl; return row
if __name__=="__main__":
    with Pool() as p: rows=p.map(ev,V)
    pd.set_option("display.width",300); pd.set_option("display.max_colwidth",40)
    print(pd.DataFrame(rows).to_string(index=False))
