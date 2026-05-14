import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Check, ChevronRight, ChevronLeft, Globe } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';

const AVATAR_EMOJIS = [
  '😊','😄','😎','🥳','😇','🤩','🥰','😜','😆','🤗','😏','🤓',
  '👦','👧','🧒','👶','🧑',
  '🐱','🐶','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🦄','🐙',
  '🌟','⭐','🌈','🎮','⚽','🏀','🎨','🎵','🚀','🎉','🏆','🦋',
];

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

interface KidDraft {
  name: string;
  color: string;
  avatar_emoji: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'kids' | 'tasks' | 'calendar' | 'meals' | 'done';
const STEPS: Step[] = ['welcome', 'kids', 'tasks', 'calendar', 'meals', 'done'];
const CONTENT_STEPS: Step[] = ['kids', 'tasks', 'calendar', 'meals', 'done'];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { t, lang, setLang } = useLanguage();
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const dm = darkMode;

  const [step, setStep] = useState<Step>('welcome');

  // Kids
  const [kids, setKids] = useState<KidDraft[]>([]);
  const [newKid, setNewKid] = useState<KidDraft>({ name: '', color: PRESET_COLORS[0], avatar_emoji: '😊' });
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [kidsError, setKidsError] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Tasks: store only selection state; titles come from t.onboardingSuggestedTasks
  const [suggestedSelected, setSuggestedSelected] = useState<boolean[]>(() =>
    t.onboardingSuggestedTasks.map(() => true)
  );
  const [customTasks, setCustomTasks] = useState<{ title: string; target_count: number }[]>([]);
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [customTaskTarget, setCustomTaskTarget] = useState(1);

  // Calendar
  const [icalUrl, setIcalUrl] = useState('');

  // Meals
  const [meals, setMeals] = useState<string[]>([]);
  const [newMeal, setNewMeal] = useState('');

  // Save/PIN
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => setRetryAfter(n => Math.max(0, n - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    function handleOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node))
        setEmojiPickerOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [emojiPickerOpen]);

  function goNext() {
    if (step === 'kids' && kids.length === 0) {
      setKidsError(true);
      return;
    }
    setKidsError(false);
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function goBack() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  function addKid() {
    if (!newKid.name.trim()) return;
    const nextColor = PRESET_COLORS[(kids.length + 1) % PRESET_COLORS.length];
    setKids([...kids, { ...newKid }]);
    setNewKid({ name: '', color: nextColor, avatar_emoji: '😊' });
    setKidsError(false);
  }

  function addCustomTask() {
    if (!customTaskTitle.trim()) return;
    setCustomTasks([...customTasks, { title: customTaskTitle.trim(), target_count: customTaskTarget }]);
    setCustomTaskTitle('');
    setCustomTaskTarget(1);
  }

  function addMeal() {
    if (!newMeal.trim()) return;
    setMeals([...meals, newMeal.trim()]);
    setNewMeal('');
  }

  const selectedSuggestedCount = suggestedSelected.filter(Boolean).length;
  const totalSelectedTasks = selectedSuggestedCount + customTasks.length;

  async function handleFinish() {
    if (saving || retryAfter > 0 || !pin.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const { token } = await api.login(pin);
      localStorage.setItem('adminToken', token);

      for (const kid of kids) {
        await api.createChild(kid);
      }
      for (let i = 0; i < t.onboardingSuggestedTasks.length; i++) {
        if (suggestedSelected[i]) {
          const st = t.onboardingSuggestedTasks[i];
          await api.createTask({ title: st.title, target_count: st.target_count, icon: 'check-circle', description: '' });
        }
      }
      for (const ct of customTasks) {
        await api.createTask({ title: ct.title, target_count: ct.target_count, icon: 'check-circle', description: '' });
      }
      if (icalUrl.trim()) {
        await api.updateCalendarSettings({ ical_url: icalUrl.trim() });
      }
      for (const meal of meals) {
        await api.createMeal(meal);
      }

      onComplete();
    } catch (err: any) {
      setSaveError(t.onboardingWrongPin);
      if (err.retryAfter) setRetryAfter(err.retryAfter);
      setSaving(false);
    }
  }

  // Styles
  const card = dm ? 'bg-gray-800' : 'bg-white';
  const bodyText = dm ? 'text-gray-100' : 'text-gray-800';
  const mutedText = dm ? 'text-gray-400' : 'text-gray-500';
  const labelText = dm ? 'text-gray-200' : 'text-gray-700';
  const inputClass = `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
    dm
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-400'
      : 'bg-white border-gray-300 text-gray-800 focus:ring-blue-500'
  }`;
  const listItem = dm ? 'bg-gray-700' : 'bg-gray-50';

  function StepIndicator() {
    if (step === 'welcome') return null;
    const current = CONTENT_STEPS.indexOf(step) + 1;
    const total = CONTENT_STEPS.length;
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${mutedText}`}>{t.onboardingStep(current, total)}</span>
        </div>
        <div className="flex gap-1">
          {CONTENT_STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < current ? 'bg-blue-500' : dm ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  function NavButtons({
    canGoBack = true,
    nextLabel,
    onNext,
    nextDisabled = false,
  }: {
    canGoBack?: boolean;
    nextLabel?: string;
    onNext?: () => void;
    nextDisabled?: boolean;
  }) {
    return (
      <div className="flex gap-3 mt-8">
        {canGoBack && (
          <button
            onClick={goBack}
            className={`flex items-center gap-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {t.back}
          </button>
        )}
        <button
          onClick={onNext ?? goNext}
          disabled={nextDisabled}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-colors ${
            nextDisabled
              ? 'bg-blue-400 text-white opacity-60 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {nextLabel ?? t.onboardingNext}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  function CountStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    const btn = `w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold transition-colors ${
      dm ? 'bg-gray-600 hover:bg-gray-500 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }`;
    return (
      <div className="flex items-center gap-1 flex-shrink-0">
        <button type="button" onClick={() => onChange(Math.max(1, value - 1))} className={btn}>−</button>
        <span className={`w-7 text-center font-semibold ${dm ? 'text-gray-100' : 'text-gray-800'}`}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className={btn}>+</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      <div className={`w-full max-w-lg rounded-2xl shadow-xl p-6 md:p-8 ${card}`}>

        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'no' ? 'EN' : 'NO'}
          </button>
        </div>

        <StepIndicator />

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h1 className={`text-3xl font-bold mb-2 ${bodyText}`}>{t.onboardingWelcomeTitle}</h1>
            <p className={`text-lg font-medium mb-2 ${dm ? 'text-blue-400' : 'text-blue-600'}`}>{t.onboardingWelcomeSubtitle}</p>
            <p className={`mb-8 leading-relaxed ${mutedText}`}>{t.onboardingWelcomeDesc}</p>

            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              {[
                { icon: '✅', label: t.featureTasks, desc: t.featureTasksDesc },
                { icon: '📅', label: t.featureCalendar, desc: t.featureCalendarDesc },
                { icon: '🍽️', label: t.featureMeals, desc: t.featureMealsDesc },
                { icon: '💬', label: t.featureMessages, desc: t.featureMessagesDesc },
              ].map(({ icon, label, desc }) => (
                <div key={label} className={`p-3 rounded-xl ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className={`font-semibold text-sm ${bodyText}`}>{label}</p>
                  <p className={`text-xs mt-0.5 leading-snug ${mutedText}`}>{desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={goNext}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {t.onboardingGetStarted}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step: Kids */}
        {step === 'kids' && (
          <div>
            <h2 className={`text-2xl font-bold mb-1 ${bodyText}`}>{t.onboardingKidsTitle}</h2>
            <p className={`mb-5 ${mutedText}`}>{t.onboardingKidsDesc}</p>

            {kids.length > 0 && (
              <div className="space-y-2 mb-4">
                {kids.map((kid, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${listItem}`}>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: kid.color + '30' }}
                    >
                      {kid.avatar_emoji}
                    </div>
                    <span className={`flex-1 font-semibold ${bodyText}`}>{kid.name}</span>
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: kid.color }} />
                    <button onClick={() => setKids(kids.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={`p-4 rounded-xl border-2 border-dashed ${dm ? 'border-gray-600' : 'border-gray-200'}`}>
              <input
                type="text"
                placeholder={t.namePlaceholder}
                value={newKid.name}
                onChange={(e) => setNewKid({ ...newKid, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addKid()}
                className={`${inputClass} mb-3`}
              />
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {/* Emoji picker */}
                <div ref={emojiPickerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                    className={`w-12 h-10 border-2 rounded-lg text-2xl transition-colors ${
                      dm
                        ? 'bg-gray-700 border-gray-600 hover:border-blue-400'
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}
                    title={t.chooseIcon}
                  >
                    {newKid.avatar_emoji}
                  </button>
                  {emojiPickerOpen && (
                    <div className={`absolute z-50 top-full mt-1 left-0 w-64 p-2 rounded-xl shadow-2xl border grid grid-cols-6 gap-1 max-h-48 overflow-y-auto ${
                      dm ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      {AVATAR_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => { setNewKid({ ...newKid, avatar_emoji: emoji }); setEmojiPickerOpen(false); }}
                          className={`text-2xl p-1 rounded-lg transition-transform hover:scale-110 ${
                            newKid.avatar_emoji === emoji
                              ? dm ? 'bg-blue-600' : 'bg-blue-100'
                              : dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Color swatches */}
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewKid({ ...newKid, color })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        newKid.color === color ? 'border-gray-700 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={addKid}
                disabled={!newKid.name.trim()}
                className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {kids.length === 0 ? t.onboardingAddChild : t.onboardingAddAnotherChild}
              </button>
            </div>

            {kidsError && (
              <p className="mt-3 text-sm text-red-500 font-medium">{t.onboardingKidsMin}</p>
            )}

            <NavButtons canGoBack={false} />
          </div>
        )}

        {/* Step: Tasks */}
        {step === 'tasks' && (
          <div>
            <h2 className={`text-2xl font-bold mb-1 ${bodyText}`}>{t.onboardingTasksTitle}</h2>
            <p className={`mb-5 ${mutedText}`}>{t.onboardingTasksDesc}</p>

            <p className={`text-sm font-semibold mb-3 ${labelText}`}>{t.onboardingTasksSuggested}</p>
            <div className="space-y-2 mb-6">
              {t.onboardingSuggestedTasks.map((task, i) => (
                <button
                  key={i}
                  onClick={() => setSuggestedSelected(prev => prev.map((v, idx) => idx === i ? !v : v))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    suggestedSelected[i]
                      ? dm ? 'border-blue-500 bg-blue-900/30' : 'border-blue-500 bg-blue-50'
                      : dm ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                    suggestedSelected[i] ? 'bg-blue-600' : dm ? 'bg-gray-600' : 'bg-gray-300'
                  }`}>
                    {suggestedSelected[i] && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`flex-1 text-left font-medium ${bodyText}`}>{task.title}</span>
                  <span className={`text-sm flex-shrink-0 ${mutedText}`}>{task.target_count}× {t.timesPerWeek}</span>
                </button>
              ))}
            </div>

            {customTasks.length > 0 && (
              <div className="space-y-2 mb-4">
                {customTasks.map((ct, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${listItem}`}>
                    <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className={`flex-1 font-medium ${bodyText}`}>{ct.title}</span>
                    <span className={`text-sm flex-shrink-0 ${mutedText}`}>{ct.target_count}× {t.timesPerWeek}</span>
                    <button onClick={() => setCustomTasks(customTasks.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className={`text-sm font-semibold mb-2 ${labelText}`}>{t.onboardingTasksAddCustom}</p>
            <div className="flex gap-2 items-center">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder={t.taskNamePlaceholder}
                  value={customTaskTitle}
                  onChange={(e) => setCustomTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTask()}
                  className={inputClass}
                />
              </div>
              <CountStepper value={customTaskTarget} onChange={setCustomTaskTarget} />
              <button
                onClick={addCustomTask}
                disabled={!customTaskTitle.trim()}
                className="px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <NavButtons />
          </div>
        )}

        {/* Step: Calendar */}
        {step === 'calendar' && (
          <div>
            <div className="text-4xl mb-3">📅</div>
            <h2 className={`text-2xl font-bold mb-1 ${bodyText}`}>{t.onboardingCalendarTitle}</h2>
            <p className={`mb-6 leading-relaxed ${mutedText}`}>{t.onboardingCalendarDesc}</p>

            <div className={`p-4 rounded-xl mb-2 ${dm ? 'bg-gray-700' : 'bg-purple-50'}`}>
              <label className={`block text-sm font-semibold mb-2 ${labelText}`}>{t.icalUrlLabel}</label>
              <input
                type="url"
                placeholder="https://calendar.google.com/calendar/ical/..."
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                className={`${inputClass} font-mono text-sm`}
              />
              <div className={`text-xs mt-3 space-y-1 ${mutedText}`}>
                <p className="font-semibold">{t.icalHowTo}</p>
                <p>Google: {t.icalGoogleHelp}</p>
                <p>Outlook: {t.icalOutlookHelp}</p>
              </div>
            </div>

            <NavButtons />
          </div>
        )}

        {/* Step: Meals */}
        {step === 'meals' && (
          <div>
            <div className="text-4xl mb-3">🍽️</div>
            <h2 className={`text-2xl font-bold mb-1 ${bodyText}`}>{t.onboardingMealsTitle}</h2>
            <p className={`mb-6 leading-relaxed ${mutedText}`}>{t.onboardingMealsDesc}</p>

            {meals.length > 0 && (
              <div className="space-y-2 mb-4">
                {meals.map((meal, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${listItem}`}>
                    <span className={`flex-1 font-medium ${bodyText}`}>{meal}</span>
                    <button onClick={() => setMeals(meals.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t.mealPlaceholder}
                value={newMeal}
                onChange={(e) => setNewMeal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMeal()}
                className={inputClass}
              />
              <button
                onClick={addMeal}
                disabled={!newMeal.trim()}
                className="px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <NavButtons />
          </div>
        )}

        {/* Step: Done / Save */}
        {step === 'done' && (
          <div>
            <div className="text-4xl mb-3">🎉</div>
            <h2 className={`text-2xl font-bold mb-1 ${bodyText}`}>{t.onboardingDoneTitle}</h2>
            <p className={`mb-5 ${mutedText}`}>{t.onboardingDoneDesc}</p>

            {/* Summary */}
            <div className={`p-4 rounded-xl mb-5 space-y-2.5 ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className={`text-sm ${bodyText}`}>{t.onboardingDoneSummaryKids(kids.length)}</span>
              </div>
              {totalSelectedTasks > 0 && (
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className={`text-sm ${bodyText}`}>{t.onboardingDoneSummaryTasks(totalSelectedTasks)}</span>
                </div>
              )}
              {icalUrl.trim() && (
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className={`text-sm ${bodyText}`}>{t.onboardingDoneSummaryCalendar}</span>
                </div>
              )}
              {meals.length > 0 && (
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className={`text-sm ${bodyText}`}>{t.onboardingDoneSummaryMeals(meals.length)}</span>
                </div>
              )}
            </div>

            {/* PIN entry */}
            <div className={`p-4 rounded-xl mb-5 ${dm ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <label className={`block text-sm font-semibold mb-1 ${labelText}`}>{t.pinTitle}</label>
              <p className={`text-xs mb-3 ${mutedText}`}>{t.onboardingDonePinHint}</p>
              <input
                type="password"
                inputMode="numeric"
                placeholder={t.pinPlaceholder}
                value={pin}
                onChange={(e) => { setPin(e.target.value); setSaveError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleFinish()}
                className={inputClass}
                maxLength={20}
                autoFocus
              />
              {saveError && <p className="mt-2 text-sm text-red-500 font-medium">{saveError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={goBack}
                className={`flex items-center gap-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                {t.back}
              </button>
              <button
                onClick={handleFinish}
                disabled={saving || retryAfter > 0 || !pin.trim()}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving
                  ? t.onboardingDoneSaving
                  : retryAfter > 0
                  ? t.waitSeconds(retryAfter)
                  : t.onboardingDoneFinish}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
