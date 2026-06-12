const tools = ['math',
    'explain',
    'essay',
    'diagram',
    'compound',
    'balancer',
    'graph',
    'notes',
    'audio',
    'simplifier',
    'quiz',
    'syllabus',
    'project'];

const histories = {
    math: [],
    explain: [],
    essay: [],
    diagram: [],
    compound: [],
    balancer: [],
    graph: [],
    notes: [],
    audio: [],
    simplifier: [],
    quiz: [],
    syllabus: [],
    project: []
};

var apikey = '';
function switchTo(input) {
    tools.forEach(t => {
        document.getElementById('panel-' + t).style.display = t === input ? 'block' : 'none';
    });
}

function assignapi() {
    apikey = document.getElementById('apikey').value.trim();
    if (!apikey) {
        alert('Please enter an API key.');
        return;
    }
    console.log('API key set for', document.getElementById('ai-picker').value);
}

async function solvemath() {
    if (!apikey) {
        document.getElementById('math-output').innerHTML = 'Enter your API key first.';
        return;
    }

    const input = document.getElementById('problemmath').value.trim();
    if (!input) return;

    const output = document.getElementById('math-output');

    // Show the student's message in the chat log
    output.innerHTML += `<p><strong>You:</strong> ${input}</p>`;
    output.innerHTML += `<p id="thinking"><em>Thinking... 💭</em></p>`;

    // Clear the input box for the next message
    document.getElementById('problemmath').value = '';

    try {
        const result = await askAI(
            'math',
            `You are a patient math tutor. Don't give the final answer immediately. 
             Guide the student step by step, give one hint at a time, 
             and respond to what they say based on the conversation so far.`,
            input
        );

        document.getElementById('thinking').remove();
        output.innerHTML += `<p><strong>AI:</strong> ${result}</p>`;
        saveToDB('Math Helper', input, result);

    } catch (error) {
        console.error('Solvemath error:', error);
        document.getElementById('thinking').remove();
        output.innerHTML += `<p>⚠️ AI request failed. Try again.</p>`;
    }
}

function resetMath() {
    clearChat('math');
    document.getElementById('math-output').innerHTML = '';
}


// ─── GEMINI ───────────────────────────────────────────────
async function askGemini(tool, systemPrompt, userMessage) {
    histories[tool].push({ role: 'user', parts: [{ text: userMessage }] });

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apikey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: histories[tool]
            })
        }
    );
    const data = await response.json();
    if (!response.ok || !data.candidates) {
        console.error('Gemini error:', data);
        return data.error?.message || 'Something went wrong.';
    }

    const reply = data.candidates[0].content.parts[0].text;
    histories[tool].push({ role: 'model', parts: [{ text: reply }] });
    return reply;
}

// ─── OPENAI ───────────────────────────────────────────────
async function askOpenAI(tool, systemPrompt, userMessage) {
    histories[tool].push({ role: 'user', content: userMessage });

    const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apikey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'system', content: systemPrompt }, ...histories[tool]]
            })
        }
    );
    const data = await response.json();
    if (!response.ok || !data.choices) {
        console.error('OpenAI error:', data);
        return data.error?.message || 'Something went wrong.';
    }

    const reply = data.choices[0].message.content;
    histories[tool].push({ role: 'assistant', content: reply });
    return reply;
}

// ─── CLAUDE ───────────────────────────────────────────────
async function askClaude(tool, systemPrompt, userMessage) {
    histories[tool].push({ role: 'user', content: userMessage });

    const response = await fetch(
        'https://api.anthropic.com/v1/messages',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apikey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-opus-4-20250514',
                max_tokens: 1024,
                system: systemPrompt,
                messages: histories[tool]
            })
        }
    );
    const data = await response.json();
    if (!response.ok || !data.content) {
        console.error('Claude error:', data);
        return data.error?.message || 'Something went wrong.';
    }

    const reply = data.content[0].text;
    histories[tool].push({ role: 'assistant', content: reply });
    return reply;
}

// ─── GROQ ───────────────────────────────────────────────
async function askGroq(tool, systemPrompt, userMessage) {
    histories[tool].push({
        role: 'user',
        content: userMessage
    });

    const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apikey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    ...histories[tool]
                ],
                temperature: 0.7
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error('Groq HTTP error:', response.status, data);
        return data.error?.message || 'Groq request failed.';
    }

    if (!data.choices || !data.choices.length) {
        console.error('Groq error:', data);
        return 'Something went wrong. Check your Groq API key.';
    }

    const reply = data.choices[0].message.content;
    histories[tool].push({
        role: 'assistant',
        content: reply
    });

    return reply;
}

async function askAI(tool, systemPrompt, userMessage) {
    const ai = document.getElementById('ai-picker').value;
    if (ai === 'gemini') return await askGemini(tool, systemPrompt, userMessage);
    if (ai === 'openai') return await askOpenAI(tool, systemPrompt, userMessage);
    if (ai === 'claude') return await askClaude(tool, systemPrompt, userMessage);
    if (ai === 'groq') return await askGroq(tool, systemPrompt, userMessage);
}

function clearChat(tool) {
    if (histories[tool]) {
        histories[tool] = [];
    }
}

function saveToDB(tool, input, output) {
    const history = JSON.parse(localStorage.getItem('stemHistory') || '[]');
    history.push({
        tool: tool,
        input: input,
        output: output,
        date: new Date().toLocaleString()
    });
    localStorage.setItem('stemHistory', JSON.stringify(history));
}

function analyzedb() {
    const history = JSON.parse(localStorage.getItem('stemHistory') || '[]');
    let html = '<ul>';
    history.forEach(entry => {
        html += `<li><strong>${entry.tool}</strong>: ${entry.input} → ${entry.output} (<em>${entry.date}</em>)</li>`;
    });
    html += '</ul>';
    document.getElementById('analyze-output').innerHTML = html;
}

function cleardb() {    
    localStorage.removeItem('stemHistory');
    document.getElementById('analyze-output').innerHTML = 'History cleared.';
}