import { useState } from 'react';
import { usePetStore, FOODS, getLevel, type Food } from '../../store/petStore';
import { useThemeStore } from '../../store/themeStore';
import MascotAvatar from '../common/MascotAvatar';
import { Card, Button } from '../common';
import { ChevronLeft, Coins, ShoppingBag, Utensils, Heart } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function PetPage({ onBack }: Props) {
  const { exp, mood, coins, stock, totalFed, buyFood, feed } = usePetStore();
  const { mascot } = useThemeStore();
  const levelInfo = getLevel(exp);
  const [tab, setTab] = useState<'home' | 'shop' | 'feed'>('home');
  const [feedMsg, setFeedMsg] = useState<string | null>(null);

  const ownedFoods = FOODS.filter((f) => (stock[f.id] || 0) > 0);

  const handleFeed = (food: Food) => {
    const ok = feed(food.id, mascot);
    if (ok) {
      const isFav = food.favorites?.includes(mascot);
      setFeedMsg(isFav ? `最爱食物！经验×1.5 🎉` : `喂了${food.name}！+${food.exp}经验`);
      setTimeout(() => setFeedMsg(null), 2000);
    }
  };

  const handleBuy = (food: Food) => {
    const ok = buyFood(food.id, 1);
    if (!ok) {
      setFeedMsg('金币不够呀~');
      setTimeout(() => setFeedMsg(null), 1500);
    }
  };

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* 顶部 */}
      <div className="sticky top-0 z-30 backdrop-blur-sm px-4 pt-4 pb-2" style={{ backgroundColor: 'var(--app-bg)', opacity: 0.95 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-full bg-white/60 active:scale-90 transition">
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">我的宠物 🐾</h1>
          </div>
          {/* 金币 */}
          <div className="flex items-center gap-1 bg-white/80 rounded-full px-3 py-1.5 shadow-cute">
            <Coins size={16} className="text-yellow-500" />
            <span className="text-sm font-bold text-gray-700">{coins}</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-2 space-y-3">
        {/* 宠物展示区 */}
        <Card>
          <div className="relative h-48 flex items-end justify-center overflow-hidden rounded-2xl"
               style={{ background: 'linear-gradient(180deg, #E8F4FD 0%, #F0F8E8 70%, #E8D4A8 100%)' }}>
            {/* 天空装饰 */}
            <div className="absolute top-3 left-4 text-xl opacity-50 animate-float" style={{ animationDuration: '5s' }}>☁️</div>
            <div className="absolute top-6 right-8 text-lg opacity-40 animate-float" style={{ animationDuration: '6s' }}>☁️</div>
            <div className="absolute top-4 right-20 text-sm opacity-30">☀️</div>

            {/* 走路的小动物 */}
            <div className="absolute bottom-2 left-0 right-0">
              <MascotAvatar mascot={mascot} size={80} />
            </div>

            {/* 喂食提示 */}
            {feedMsg && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-4 py-1.5 shadow-cute text-xs font-bold text-pink-500 animate-pop-in z-20">
                {feedMsg}
              </div>
            )}
          </div>

          {/* 等级 + 心情 */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{levelInfo.emoji}</span>
                <span className="text-sm font-bold text-gray-700">Lv.{levelInfo.lv} {levelInfo.name}</span>
              </div>
              <span className="text-xs text-gray-400">经验 {exp}</span>
            </div>
            {/* 经验条 */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
            {levelInfo.next && (
              <p className="text-[10px] text-gray-400">距下一级还需 {levelInfo.next.minExp - exp} 经验</p>
            )}

            {/* 心情 */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <Heart size={14} className="text-pink-400" fill="#FFB3C1" />
                <span className="text-xs text-gray-500">心情</span>
              </div>
              <span className="text-xs text-gray-400">{Math.round(mood)}/100</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-300 to-pink-500 rounded-full transition-all"
                style={{ width: `${mood}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Tab 切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('feed')}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition active:scale-95 ${
              tab === 'feed' ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-cute' : 'bg-white/60 text-gray-400'
            }`}
          >
            <Utensils size={14} className="inline mr-1" /> 喂食
          </button>
          <button
            onClick={() => setTab('shop')}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition active:scale-95 ${
              tab === 'shop' ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-cute' : 'bg-white/60 text-gray-400'
            }`}
          >
            <ShoppingBag size={14} className="inline mr-1" /> 商店
          </button>
        </div>

        {/* 喂食列表 */}
        {tab === 'feed' && (
          <Card>
            <h3 className="text-sm font-bold text-gray-700 mb-3">🍖 我的食物仓库</h3>
            {ownedFoods.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">📦</div>
                <p className="text-sm text-gray-400">仓库空空的~</p>
                <p className="text-xs text-gray-300 mt-1">去商店买点饲料吧！</p>
                <Button variant="primary" size="sm" className="mt-3" onClick={() => setTab('shop')}>
                  去商店
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {ownedFoods.map((food) => {
                  const isFav = food.favorites?.includes(mascot);
                  return (
                    <button
                      key={food.id}
                      onClick={() => handleFeed(food)}
                      className="relative bg-pink-50/50 rounded-xl p-3 active:scale-95 transition text-left"
                    >
                      {isFav && (
                        <span className="absolute -top-1 -right-1 text-[8px] bg-pink-400 text-white rounded-full px-1.5 py-0.5">最爱</span>
                      )}
                      <div className="text-2xl mb-1">{food.emoji}</div>
                      <div className="text-xs font-bold text-gray-700">{food.name}</div>
                      <div className="text-[10px] text-gray-400">×{stock[food.id]} | +{food.exp}exp</div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* 商店 */}
        {tab === 'shop' && (
          <Card>
            <h3 className="text-sm font-bold text-gray-700 mb-3">🛒 饲料商店</h3>
            <div className="grid grid-cols-2 gap-2">
              {FOODS.map((food) => {
                const isFav = food.favorites?.includes(mascot);
                const canBuy = coins >= food.price;
                return (
                  <div key={food.id} className="relative bg-white border border-pink-100 rounded-xl p-3">
                    {isFav && (
                      <span className="absolute -top-1 -right-1 text-[8px] bg-pink-400 text-white rounded-full px-1.5 py-0.5">最爱</span>
                    )}
                    <div className="text-2xl mb-1">{food.emoji}</div>
                    <div className="text-xs font-bold text-gray-700">{food.name}</div>
                    <div className="text-[10px] text-gray-400 mb-2">{food.desc}</div>
                    <button
                      onClick={() => handleBuy(food)}
                      disabled={!canBuy}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                        canBuy
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                          : 'bg-gray-100 text-gray-300'
                      }`}
                    >
                      <Coins size={10} className="inline mr-0.5" />
                      {food.price}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 统计 */}
        <Card>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-pink-400">{totalFed}</div>
              <div className="text-[10px] text-gray-400">累计喂食</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-500">{coins}</div>
              <div className="text-[10px] text-gray-400">当前金币</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">{levelInfo.lv}</div>
              <div className="text-[10px] text-gray-400">宠物等级</div>
            </div>
          </div>
        </Card>

        <div className="text-xs text-gray-400 bg-pink-50/50 rounded-xl p-3">
          💡 <b>赚金币攻略：</b><br/>
          打卡 +5 | 完成计划 +3 | 番茄钟 +2<br/>
          刷题记录 +2 | 完成复盘 +2<br/>
          <span className="text-pink-400">最爱食物经验×1.5，快去发现你的小动物爱吃什么吧！</span>
        </div>
      </div>
    </div>
  );
}