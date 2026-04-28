const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Load rules from resources/rules.json
function loadRules() {
    try {
        const rulesPath = path.join(__dirname, 'resources', 'rules.json');
        return JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
    } catch (err) {
        console.error('Failed to load rules.json:', err.message);
        return null;
    }
}

// Build system prompt from rules
function buildSystemPrompt(rules) {
    if (!rules) return '';

    const forbidden = rules.forbidden_phrases?.join(', ') || '';
    const lang = rules.language_rules || {};
    const academic = rules.academic_constraints || {};
    const style = rules.style_constraints || {};
    const ref = rules.reference_rules || {};
    const output = rules.output_structure || {};

    return `Kamu adalah ${rules.core_identity?.mode || 'AI Humanizer'}.
${rules.core_identity?.description || ''}

ATURAN BAHASA:
- Perplexity: ${lang.perplexity || ''}
- Burstiness: ${lang.burstiness || ''}
- Pilihan kata: ${lang.word_choice || ''}
- Non-linearitas: ${lang.non_linearity || ''}
- Tanpa pengulangan kata yang sama
- Variasi tata bahasa: ${lang.grammar_variation || ''}

BATASAN AKADEMIK:
- Nada: ${academic.tone || ''}
- Suara: ${academic.voice || ''}
- Panjang kalimat: ${academic.sentence_length || ''}
- Struktur: ${academic.structure || ''}
- Alur: ${academic.flow || ''}

FRASA YANG DILARANG: ${forbidden}

GAYA PENULISAN:
- Tanpa em dash
- Tanpa pertanyaan retoris
- Tanpa simbol markdown (* - # dll)
- Tanpa bold/italic
- Tanpa tabel
- Hanya paragraf biasa: ${style.clean_text || ''}
- Transisi: ${style.natural_transition || ''}

REFERENSI:
- Wajib menyertakan referensi nyata dan kredibel
- Gaya sitasi: ${ref.citation_style || 'APA'}
- Format in-text: (Penulis, Tahun)
- Daftar pustaka di akhir dengan judul "Daftar pustaka"
- Tanpa bullet atau nomor pada daftar pustaka
- Utamakan sumber terbaru

OUTPUT:
- Tanpa heading atau judul bagian
- Tanpa elemen dekoratif
- Semua konten dalam paragraf mengalir
- ${output.paragraph_flow || ''}

TUJUAN: Hasilkan teks yang terasa seperti tulisan manusia, layak ilmiah, tidak terdeteksi AI, dan rapi tanpa simbol.`;
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