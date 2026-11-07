import sys, random, itertools, pickle
sys.path.insert(0,'.')
import pandas as pd, bt
from bt import T
from multiprocessing import Pool
SYMS=["NQ","ES","YM","GC","SI"]
D={s:pd.read_pickle(f"data/{s}.pkl") for s in SYMS}
# split: first half / second half by date
cut=D["NQ"].index[len(D["NQ"])//2]
H1={s:d[d.index<cut] for s,d in D.items()}
H2={s:d[d.index>=cut] for s,d in D.items()}
W={"AM":((T(9,30),T(11,30)),),"AM+PM":((T(9,30),T(11,30)),(T(13,30),T(15,45))),
   "LON+AM":((T(3),T(5)),(T(9,30),T(11,30))),"ALL":((T(3),T(5)),(T(9,30),T(11,30)),(T(13,30),T(15,45)))}
space=dict(model=["IFVG","FVG","Both"],level=["edge","ce"],stop=["zone","sweep"],tp=[300,500],
  min_rr=[1.0,1.5,2.0],win=list(W),use_swings=[False,True],reclaim=[True,False],entry=["limit","market"],
  sweep_expiry=[10,20,40],risk=[250,400])
keys=list(space)
allc=list(itertools.product(*space.values()))
random.seed(7); combos=random.sample(allc,900)
def ev(cmb):
    cfg=dict(zip(keys,cmb)); w=cfg.pop("win"); cfg["windows"]=W[w]; cfg["use_nyam"]=w in("AM+PM","ALL")
    cfg["max_trades"]=3; cfg["stop_on_win"]=False
    out={}
    for tag,DD in (("h1",H1),("h2",H2)):
        for s in SYMS:
            tr,eq,bl=bt.run(DD[s],s,**cfg); out[(tag,s)]=bt.stats(tr,eq,bl)
    return dict(zip(keys,cmb)),out
if __name__=="__main__":
    with Pool() as p: res=p.map(ev,combos,chunksize=4)
    pickle.dump(res,open("grid.pkl","wb")); print("done",len(res),cut)
