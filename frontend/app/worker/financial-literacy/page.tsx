'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { getToken, getUser } from '@/lib/auth';

type Lang = 'en' | 'sw';

const CONTENT: Record<Lang, { intro: string; topics: { label: string; answer: string }[]; placeholder: string; title: string }> = {
  en: {
    title: 'Financial literacy',
    intro: "Hello! I'm here to help you understand saving, budgeting, and growing your money. Choose a topic below or ask anything.",
    placeholder: 'Ask about saving, M-Pesa, or budgeting...',
    topics: [
      { label: 'Why save?', answer: 'Saving helps you handle emergencies, plan for big things (school, home), and feel safe. Even small amounts add up. Start with what you can.' },
      { label: 'How to budget', answer: 'List what you earn, then what you spend (food, transport, airtime). Spend less than you earn. Save the rest first, then use what is left for needs.' },
      { label: 'M-Pesa & mobile money', answer: 'Use M-Pesa to get paid and pay bills. Keep some money in the wallet for daily use. You can also move extra to M-Pesa savings or lock it to avoid spending it.' },
      { label: 'Earning interest', answer: 'When you save in Stellar USD or other savings products, your money can grow over time (interest). The more you save and the longer you leave it, the more you can earn.' },
      { label: 'Avoiding debt traps', answer: 'Only borrow when necessary and when you can repay. Avoid borrowing to buy things you don’t need. Compare rates; some loans are very expensive.' },
      { label: 'Setting goals', answer: 'Set a clear goal: e.g. "Save 5,000 in 3 months." Save a little each week. Track your progress. Celebrate when you reach it, then set the next goal.' },
    ],
  },
  sw: {
    title: 'Elimu ya kifedha',
    intro: "Habari! Niko hapa kukusaidia kuelewa kuokoa, bajeti, na kukuza pesa zako. Chagua mada hapa chini au uliza chochote.",
    placeholder: 'Uliza kuhusu kuokoa, M-Pesa, au bajeti...',
    topics: [
      { label: 'Kwa nini kuokoa?', answer: 'Kuokoa kunasaidia kukabiliana na dharura, kupanga mambo makubwa (shule, nyumba), na kujisikia salama. Hata kiasi kidogo kinajenga. Anza na unachoweza.' },
      { label: 'Jinsi ya kufanya bajeti', answer: 'Andika unachopata, kisha unachotumia (chakula, usafiri, airtime). Tumia chini ya unachopata. Okoa kwanza, kisha tumia kilichobaki kwa mahitaji.' },
      { label: 'M-Pesa na pesa za simu', answer: 'Tumia M-Pesa kupokea malipo na kulipa bili. Weka pesa kidogo kwenye pochi kwa matumizi ya kila siku. Unaweza pia kuhamisha zaidi kwenye akiba ya M-Pesa au kufunga ili usitumie.' },
      { label: 'Kupata riba', answer: 'Unapookoa kwenye Stellar USD au bidhaa nyingine za akiba, pesa zako zinaweza kukua (riba). Kadri unavyokua na kuacha kwa muda mrefu, ndivyo unaweza kupata zaidi.' },
      { label: 'Kuepuka madeni mabaya', answer: 'Kopa tu wakati ni lazima na unapoweza kulipa. Epuka kukopa kununua vitu usivyohitaji. Linganisha viwango; mikopo mingine ni ghali sana.' },
      { label: 'Kuweka malengo', answer: 'Weka lengo wazi: kwa mfano "Okoa 5,000 kwa miezi 3." Okoa kidogo kila wiki. Fuatilia maendeleo. Sherehekea unapofikia, kisha weka lengo linalofuata.' },
    ],
  },
};

export default function FinancialLiteracyPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/auth/login');
      return;
    }
    const user = getUser();
    if (user?.user_type !== 'employee') {
      router.push('/employer/dashboard');
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    const c = CONTENT[lang];
    setMessages([{ role: 'bot', text: c.intro }]);
  }, [lang, ready]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const content = CONTENT[lang];

  const sendUserMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: text.trim() }]);
    setInput('');
    const lower = text.trim().toLowerCase();
    let reply = content.topics.find(
      (t) => t.label.toLowerCase().includes(lower) || lower.includes(t.label.toLowerCase().split(' ')[0])
    )?.answer;
    if (!reply) {
      const any = content.topics[Math.floor(Math.random() * content.topics.length)];
      reply =
        lang === 'en'
          ? `Good question. For now I can help most with this topic: "${any.label}". ${any.answer}`
          : `Hiyo ni swali nzuri. Kwa sasa naweza kusaidia zaidi kwa mada hii: "${any.label}". ${any.answer}`;
    }
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'bot', text: reply! }]);
    }, 600);
  };

  if (!ready) {
    return (
      <div>
        <PageHeader title="Financial literacy" description="Loading..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={content.title}
        description="Learn about saving, budgeting & growing your money"
      />

      {/* Language toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setLang('en')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            lang === 'en' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLang('sw')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            lang === 'sw' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Kiswahili
        </button>
      </div>

      {/* Chat UI */}
      <div className="rounded-3xl overflow-hidden border border-amber-200/60 shadow-xl bg-gradient-to-b from-amber-50/80 to-white">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <BookOpen className="text-white" size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {lang === 'en' ? 'Finance guide' : 'Mwongozo wa kifedha'}
            </h3>
            <p className="text-amber-100 text-sm">
              {lang === 'en' ? 'Ask anything' : 'Uliza chochote'}
            </p>
          </div>
        </div>

        <div className="h-[420px] overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                  m.role === 'user'
                    ? 'bg-amber-600 text-white rounded-br-md'
                    : 'bg-white border border-amber-100 text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Topic chips */}
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {content.topics.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => sendUserMessage(t.label)}
              className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-medium hover:bg-amber-200 transition"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-amber-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendUserMessage(input)}
            placeholder={content.placeholder}
            className="flex-1 px-4 py-3 rounded-xl border border-amber-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <button
            type="button"
            onClick={() => sendUserMessage(input)}
            disabled={!input.trim()}
            className="p-3 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition"
            aria-label="Send"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-4">
        {lang === 'en'
          ? 'Tips are for education only. For specific advice, talk to a trusted advisor.'
          : 'Mbinu ni kwa elimu tu. Kwa ushauri maalum, ongea na mshauri mwenye kuaminika.'}
      </p>
    </div>
  );
}
