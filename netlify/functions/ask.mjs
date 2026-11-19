// مقابلات الممارسين: أضف ممارس جديد تحت رمز تخصصه
const KB = {
 "cs": [
  {
   "name": "رباب",
   "role": "مختصة خوادم وإدارة بيانات (سيستم أدمن)، خريجة علوم حاسب",
   "note": "من فريق المشروع، نسخة تجريبية",
   "text": "## ١. ليش اخترت التخصص؟\nاخترته لان التخصص متطور ومطلوب والدنيا كلها معتمدة ع التكنولوجيا.\n\n## ٢. وش كنت تتوقع، ووش لقيت فعلاً؟\nكنت أتوقع ان التخصص سهل ومقدور عليه بس طلع بحر وعالم متغير وسريع، واهو تخصص داخل بحر تخصصات، ما راح تعيش فيه الا لما تحبه.\n\n## ٣. وش أصعب شي في الدراسة؟\nأصعب شي في الدراسة كانت انها رؤوس اقلام ومواد مختلفة (شبكات، عدة لغات برمجة، هندسة برمجيات، خوارزميات، الخ الخ) وكلها كانت بحر والخمس سنوات ما تغطي شي.\n\n## ٤. هل يحتاج تكون شاطر في مادة معينة؟\nرياضيات، بس مو بمعنى ان تكون شاطر في احصاء او جبر او غيره. بس تكون عندك عقلية منطقية.\n\n## ٥. فيه أحد ترك التخصص؟ ليش؟\nايوة فيه، فيه اللي ما قدروا يتحملون الضغط وكمية التفرغ والتكريس اللي يتطلبه التخصص.\n\n## ٦. وش يصير في يوم عادي في شغلك؟\n(من واقع شغلي كسيستم أدمن) يوم طبيعي في شغلي عبارة عن مكتب ومجموعة تاسكات تدخل في بعض واكواد وتفكير منطقي وايجاد حلول.\n\n## ٧. وش أكثر شي تحبه، ووش أكثر شي يضايقك؟\nأكثر شي احبه هو التكويد وحل المشاكل واختراع حلول مبتكرة، اكثر شي يضايقني اني ما الحق واواكب التطور.\n\n## ٨. كيف كانت فرص الوظيفة بعد التخرج؟\nكانت الفرص كثيرة، تتراوح بين رسبشن الى تدريس الى عمل مكتبي الى برمجة الى شركات كبرى وفرص واسعة.\n\n## ٩. وش المهارات اللي تحتاجها وما يعلمونها في الجامعة؟\nالمواكبة والانضباط والتعلم الذاتي. الحاسب يشبه الطب في انك لازم تستمر في التعلم.\n\n## ١٠. مين يناسبه التخصص؟\nالتخصص يناسب أصحاب عقولهم منطقية تفكر في حلول عملية.\n\n## ١١. لو رجع فيك الزمن، تختاره مرة ثانية؟\nاختاره وعيوني مغمضة، لان التخصص ممتع وفيه حس مغامرة بالنسبة لي.\n\n## ١٢. نصيحة لطالب ثالث ثانوي محتار؟\nاذا مخك دايم يفكر كيف هذا الشي اشتغل وايش اساسه فممكن يكون الحاسب لك. جرب منصات تعلم البرمجة، اذا حبيتها بتحب الحاسب. اطلع على الشبكات والبرمجة والذكاء الاصطناعي من الناحية التقنية، اذا اندمجت فيها فهو التخصص المناسب."
  }
 ]
};


const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SYSTEM = `أنت «مساعد بوصلة مستقبلك»، تساعد طالب سعودي قبل اختيار تخصصه الجامعي.
القواعد:
- رد باللهجة السعودية البسيطة، قصير وواضح (٣ إلى ٦ أسطر).
- اعتمد فقط على المعلومات المرفقة: نتيجة الطالب، ومعلومات التخصصات، ومقابلات الممارسين.
- إذا نقلت كلام ممارس، اذكر اسمه ودوره، مثل: «رباب (سيستم أدمن) تقول...».
- إذا ما لقيت الجواب في المعلومات المرفقة، قل بصراحة إنك ما عندك معلومة عنه، ولا تخترع أرقام أو رواتب أو أسماء جامعات.
- لا تعطي حكم نهائي على مستقبل الطالب، الميول مؤشر مو قدر.
- لا تطلب من الطالب أي معلومات شخصية.
- إذا السؤال خارج اختيار التخصص، رجّعه بلطف للموضوع.`;

const clip = (s, n) => String(s ?? '').slice(0, n);

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) { console.log('NO KEY: GEMINI_API_KEY is missing'); return Response.json({ error: 'no_key' }, { status: 500 }); }

  let b;
  try { b = await req.json(); } catch { return Response.json({ error: 'bad_json' }, { status: 400 }); }
  const q = clip(b.q, 500).trim();
  if (!q) return Response.json({ error: 'empty' }, { status: 400 });

  const majors = Array.isArray(b.majors) ? b.majors.slice(0, 8) : [];
  const ids = majors.map((m) => m && m.id).filter(Boolean);
  const interviews = ids.flatMap((id) => (KB[id] || []).map((p) => ({ major: id, ...p })));

  const context = {
    student: { sex: b.sex === 'f' ? 'أنثى' : 'ذكر', topInterests: clip(b.top, 200) },
    majors,
    practitionerInterviews: interviews,
  };
  const history = (Array.isArray(b.history) ? b.history.slice(-6) : [])
    .filter((h) => h && (h.r === 'user' || h.r === 'model'))
    .map((h) => ({ role: h.r, parts: [{ text: clip(h.t, 800) }] }));

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM + '\n\nالمعلومات المرفقة (JSON):\n' + clip(JSON.stringify(context), 30000) }] },
    contents: [...history, { role: 'user', parts: [{ text: q }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
  };

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
    });
    if (!r.ok) { console.log('GEMINI ERROR', r.status, (await r.text()).slice(0, 500)); return Response.json({ error: 'upstream', status: r.status }, { status: 502 }); }
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    if (!text) return Response.json({ error: 'empty_answer' }, { status: 502 });
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: 'network' }, { status: 502 });
  }
};

export const config = { path: '/api/ask' };
