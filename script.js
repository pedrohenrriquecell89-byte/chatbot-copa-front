// =========================================================
// CONFIGURAÇÃO
// =========================================================
//
// Durante o desenvolvimento local:
// const API_URL = "http://127.0.0.1:5000";
//
// Em produção:
// const API_URL = "https://SEU-BACKEND.onrender.com";

const API_URL = "https://backend-8sl2.onrender.com";

const chat = document.getElementById("chat");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

let historico = [];

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

function formatarResposta(texto) {
    let seguro = escaparHTML(texto);

    seguro = seguro.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    seguro = seguro.replace(/\n/g, "<br>");

    return seguro;
}

function adicionarMensagem(texto, tipo) {
    const container = document.createElement("div");
    container.className = `message ${tipo}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = tipo === "user" ? "👤" : "🏆";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const nome = document.createElement("strong");
    nome.textContent = tipo === "user" ? "Você" : "Copa GPT";

    const content = document.createElement("div");
    content.innerHTML = formatarResposta(texto);

    bubble.appendChild(nome);
    bubble.appendChild(content);

    container.appendChild(avatar);
    container.appendChild(bubble);

    chat.appendChild(container);
    chat.scrollTop = chat.scrollHeight;
}

function mostrarDigitando() {
    const container = document.createElement("div");
    container.id = "typing";
    container.className = "message bot";

    container.innerHTML = `
        <div class="avatar">🏆</div>
        <div class="bubble">
            <strong>Copa GPT</strong>
            <p>⚽ Consultando a história das Copas...</p>
        </div>
    `;

    chat.appendChild(container);
    chat.scrollTop = chat.scrollHeight;
}

function removerDigitando() {
    document.getElementById("typing")?.remove();
}

async function enviarMensagem(pergunta) {
    if (!pergunta) return;

    sendButton.disabled = true;
    input.disabled = true;

    adicionarMensagem(pergunta, "user");
    mostrarDigitando();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const resposta = await fetch(`${API_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: pergunta,
                history: historico
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        let dados = {};
        try {
            dados = await resposta.json();
        } catch {
            throw new Error("O servidor retornou uma resposta inválida.");
        }

        removerDigitando();

        if (!resposta.ok || !dados.success) {
            throw new Error(
                dados.error || "Erro desconhecido no servidor."
            );
        }

        const respostaIA = dados.response;

        adicionarMensagem(respostaIA, "bot");

        historico.push({
            role: "user",
            content: pergunta
        });

        historico.push({
            role: "assistant",
            content: respostaIA
        });

        if (historico.length > 12) {
            historico = historico.slice(-12);
        }

    } catch (erro) {
        removerDigitando();

        console.error(erro);

        let mensagem =
            "⚠️ Não consegui falar com o servidor agora.";

        if (erro.name === "AbortError") {
            mensagem +=
                " O servidor demorou demais para responder.";
        } else {
            mensagem +=
                " Verifique a URL do Render e tente novamente.";
        }

        adicionarMensagem(mensagem, "bot");

    } finally {
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const pergunta = input.value.trim();

    if (!pergunta) return;

    if (pergunta.length > 4000) {
        alert("A pergunta é muito grande.");
        return;
    }

    input.value = "";
    input.style.height = "auto";

    enviarMensagem(pergunta);
});

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});

document.querySelectorAll(".suggestions button").forEach((button) => {
    button.addEventListener("click", () => {
        input.value = button.dataset.question;
        form.requestSubmit();
    });
});

input.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = `${Math.min(this.scrollHeight, 140)}px`;
});
