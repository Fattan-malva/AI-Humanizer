const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Load rules from resources/rules.json
function loadRules() {
    try {
        // Handle both local and Vercel environments
        const baseDir = process.env.VERCEL ? path.join(process.cwd(), 'resources') : path.join(__dirname, 'resources');
        const rulesPath = path.join(baseDir, 'rules.json');
        return JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
    } catch (err) {
        console.error('Failed to load rules.json:', err.message);
        return null;
    }
}

// Build system prompt from rules
function buildSystemPrompt(rules) {
    if (!rules) return '';

    const core = rules.core_identity || {};
    const priority = rules.priority_rules || {};
    const lang = rules.language_rules || {};
    const antiAI = rules.anti_ai_patterns || {};
    const humanVar = rules.human_variation || {};
    const academic = rules.academic_constraints || {};
    const lengthCtrl = rules.length_control || {};
    const forbidden = rules.forbidden_phrases?.join(', ') || '';
    const style = rules.style_constraints || {};
    const example = rules.example_rules || {};
    const ref = rules.reference_rules || {};
    const output = rules.output_structure || {};
    const goal = rules.output_goal || {};

    return `Kamu adalah ${core.mode || 'AI Humanizer'}.
${core.description || ''}

ATURAN PRIORITAS:
- Struktur lebih penting dari gaya: ${priority.structure_over_style || false}
- Penomoran WAJIB: ${priority.numbering_is_mandatory || false}
- Gagal jika tidak bernomor: ${priority.fail_if_not_numbered || false}

ATURAN BAHASA:
- Perplexity: ${lang.perplexity || ''}
- Burstiness: ${lang.burstiness || ''}
- Pilihan kata: ${lang.word_choice || ''}
- Non-linearitas: ${lang.non_linearity || ''}
- Tanpa pengulangan: ${lang.no_repetition || false}
- Variasi tata bahasa: ${lang.grammar_variation || ''}
- Perbolehkan ketidaksempurnaan: ${lang.imperfection || false}

PATTERN ANTI-AI:
- Hindari struktur paralel: ${antiAI.avoid_parallel_structure || false}
- Hindari pembuka kalimat identik: ${antiAI.avoid_identical_sentence_opening || false}
- Hindari pembuka terlalu formal: ${antiAI.avoid_overly_formal_opening || false}
- Hindari contoh template: ${antiAI.avoid_template_examples || false}
- Hindari keseimbangan sempurna: ${antiAI.avoid_perfect_symmetry || false}
- Putus alami: ${antiAI.natural_breaks || false}

VARIASI MANUSIA:
- Variasikan gaya setiap jawaban: ${humanVar.vary_each_answer_style || false}
- Sedikit pergeseran nada per nomor: ${humanVar.slight_tone_shift_per_number || false}
- Hindari pola kalimat sama: ${humanVar.avoid_same_sentence_pattern_across_answers || false}
- Perbolehkan inkonsistensi gaya ringan: ${humanVar.allow_minor_style_inconsistency || false}

BATASAN AKADEMIK:
- Nada: ${academic.tone || ''}
- Suara: ${academic.voice || ''}
- Panjang kalimat: ${academic.sentence_length || ''}
- Kecepatan: ${academic.directness || ''}
- Alur: ${academic.flow || ''}

KONTROL PANJANG:
- Kata per jawaban: ${lengthCtrl.per_answer_words || ''}
- Maksimum paragraf per jawaban: ${lengthCtrl.max_paragraphs_per_answer || ''}
- Hindari overexplaining: ${lengthCtrl.avoid_overexplaining || false}

FRASA YANG DILARANG: ${forbidden}

BATASAN GAYA:
- Tanpa em dash: ${style.no_em_dash || false}
- Tanpa pertanyaan: ${style.no_questions || false}
- Tanpa bold markdown: ${style.no_bold_markdown || false}
- Tanpa simbol formatting: ${style.no_symbols_formatting || false}
- Tanpa tabel: ${style.no_tables || false}
- Hanya paragraf: ${style.paragraph_only || false}

ATURAN CONTOH:
- Maksimum contoh: ${example.max_examples || 1}
- Hindari contoh generik: ${example.avoid_generic_examples || false}
- Gaya contoh: ${example.example_style || ''}

REFERENSI:
- Wajib menyertakan referensi: ${ref.require_references || false}
- WAJIB ada link URL ASLI yang sudah dicek: ${ref.require_url || false}
- Referensi harus RELEVAN dengan topik yang ditanya
- URL harus dari sumber resmi (jurnal, pemerintah, universitas)
- JANGAN bikin URL sendiri - harus benar-benar ada
- Cari dulu di Google, baru tulis referensi dengan URL asli
- Kalau tidak yakin URL-nya benar, tulis jawaban tanpa referensi
- Format: APA 7th Edition
- Struktur output: Daftar Pustaka (format APA) + Sumber Referensi (link URL terpisah)
- Contoh format: <i>Nama Penulis</i>. (Tahun). <i>Judul</i>. Penerbit.<br>Sumber: <a href='https://url-asli.com'>https://url-asli.com</a>
- URL WAJIB yang benar dan bisa dibuka!
- Gunakan format HTML: <i> untuk italic, <a href='URL'>URL</a> untuk link yang bisa diklik

OUTPUT:
- Mode multi-pertanyaan: ${output.multi_question_mode || false}
- Paksa penomoran: ${output.enforce_numbering || false}
- Gaya penomoran: ${output.numbering_style || ''}
- Format ketat: ${output.strict_format?.join(', ') || ''}
- Setiap jawaban 1 paragraf: ${output.per_answer_format || ''}
- Pemisahan: ${output.separation || ''}
- Sub-poin: ${output.sub_numbering?.enabled || ''}
- Format sub-poin: ${output.sub_numbering?.format || ''}
- Tanpa heading: ${output.no_headings || false}
- Bagian bibliografi: ${output.bibliography_section || ''}
- Format output: ${output.bibliography_format?.format_output || 'HTML'}
- Struktur: ${output.bibliography_format?.struktur || 'Daftar Pustaka'} + ${output.bibliography_format?.struktur_link || 'Sumber Referensi'}

TUJUAN:
- Skor manusia: ${goal.human_score || ''}
- Validitas akademik: ${goal.academic_validity || ''}
- Stealth: ${goal.stealth || ''}
- Struktur benar: ${goal.structure_correct || ''}
- Referensi aman: ${goal.reference_safe || ''}

${goal.human_score || 'Hasilkan teks yang terasa seperti tulisan manusia, layak ilmiah, tidak terdeteksi AI, dan rapi tanpa simbol.'}`;
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const rules = loadRules();
    const systemPrompt = buildSystemPrompt(rules);
    const enhancedPrompt = systemPrompt
        ? `${systemPrompt}\n\n---\nTugas pengguna:\n${message}`
        : message;

    try {
        const response = await fetch('https://malva-assistant-api.vercel.app/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: enhancedPrompt }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('API error:', response.status, errText);
            return res.status(502).json({ error: `API responded with ${response.status}` });
        }

        const data = await response.json();
        // Support both { reply } and { response } or raw text
        const reply = data.reply || data.response || data.message || data.text || (typeof data === 'string' ? data : JSON.stringify(data));
        res.json({ reply });
    } catch (err) {
        console.error('Fetch error:', err.message);
        res.status(500).json({ error: 'Failed to connect to AI API' });
    }
});

app.listen(PORT, () => {
    console.log(`\n✦ Malva Humanizer Chat running at http://localhost:${PORT}\n`);
});

module.exports = app;