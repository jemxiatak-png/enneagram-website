const TYPE_DESCRIPTIONS = {
  1: "【響く表現】明確・正確・筋道の通った説明。具体的な根拠や基準を示す。「公正」「一貫性」「改善」などのワードが刺さる。【避ける表現】「まあいいか」「そこそこで十分」「完璧じゃなくていい」などの基準を下げる発言。感情だけの訴え・曖昧な言い方。「細かすぎる」「融通が利かない」などの人格批判。",
  2: "【響く表現】具体的な感謝（「〇〇してくれたおかげで助かった」）。相手自身への関心（「あなたは最近どう？」）。温かく関係重視のトーン。【避ける表現】感謝なしの指摘・要求。冷淡・事務的なトーン。「別に助けてもらわなくていい」「大丈夫、自分でできる」などの拒絶感。「やりすぎ」「おせっかい」。",
  3: "【響く表現】結論から先に・端的に。「効率」「成果」「目標達成」を軸にした表現。数値や結果を明確に。努力が結果に出ていると伝える。【避ける表現】回りくどい前置き。「ゆっくり休んで」などの方向性が曖昧な言葉。「成果より過程が大事」などプロセス重視の発言。失敗・無能を示唆するニュアンス。",
  4: "【響く表現】その人だけへの個別・具体的な言葉。感情の承認（「あなたの気持ちはよくわかる」）。「あなたの独自性」「本物」「深み」に触れる表現。【避ける表現】「明るく考えて」「そのうち忘れるよ」「みんなそうだよ」などの感情の矮小化・独自性の否定。表面的なお世辞。感情を無視する態度。",
  5: "【響く表現】論理・データ・根拠を示す。簡潔・要点のみ。「考える時間を取ってください」など相手のペースを尊重する。意見を求める形で話す。【避ける表現】「今すぐ答えて」などの即答要求。感情的な訴え・泣き落とし。「もっと気持ちを話して」などの感情の掘り下げ要求。「みんなそうしてる」などの同調圧力。",
  6: "【響く表現】根拠・データをセットで伝える。「一緒にやろう」「私がついている」などの安心感。「心配な点を全部話して」と懸念を引き出す。約束や一貫性を示す。【避ける表現】根拠なしの「信じて」「大丈夫だから」。「考えすぎ」「心配性」などの不安の否定。突然の方針転換・曖昧な指示。",
  7: "【響く表現】「楽しい」「ワクワク」「可能性」「選択肢」などのポジティブワード。アイデアをまず受け入れてから絞り込む。制限も「自由の選択肢」として提示する。【避ける表現】「これは深刻です」などの重厚な入り方。「それは無理」「現実的じゃない」などの即座の却下。「落ち着いて」「じっくり考えて」などの束縛感。",
  8: "【響く表現】結論から・率直に・言い切る。「率直に言います」「反論してもいいですよ」など対等な立場を示す。自信を持ってはっきり伝える。【避ける表現】回りくどい・遠回しな表現。「落ち着いて」「そんなに強く言わなくても」（最大の地雷）。びくびくした態度・優柔不断。操作・根回し・誘導の印象を与える言い方。",
  9: "【響く表現】「お願いしてもいい？」などの招待形式。具体的な二択を提示（「AとBどっちがいい？」）。「急がなくていいよ」「あなたのペースで」など時間プレッシャーなし。【避ける表現】「早く決めて」「なんでもいいから言って」などの急かし。「もっとはっきり言って」などの自己主張の強要。漠然とした「どうしたい？」。",
};

const SYSTEM_PROMPT = `あなたはエニアグラムの専門家です。
ユーザーが伝えたいメッセージを、指定されたエニアグラムタイプの相手に「すんなり受け入れられる表現」に翻訳します。

厳守ルール：
- 翻訳後のテキストのみ出力する。前置き・後置き・説明は一切禁止。最初の文字から翻訳文を始めること
- 元のメッセージの1.5倍以内の長さに収める
- 自然な日本語で、LINEで送れる文章にする`;

export async function onRequestPost(context) {
  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { type, message } = body;
  if (!type || !message || !TYPE_DESCRIPTIONS[type]) {
    return new Response(JSON.stringify({ error: "Invalid parameters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userPrompt = `相手のエニアグラムタイプ：タイプ${type}
タイプ${type}の特徴：${TYPE_DESCRIPTIONS[type]}

伝えたいメッセージ：
${message}

上記を、タイプ${type}の相手にすんなり受け入れられる表現に翻訳してください。`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: `API error: ${response.status}`, detail: err }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await response.json();
  const translated = data.content?.[0]?.text?.trim() ?? "";

  return new Response(JSON.stringify({ translated }), {
    headers: { "Content-Type": "application/json" },
  });
}
