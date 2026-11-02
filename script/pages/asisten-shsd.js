document.addEventListener("DOMContentLoaded", () => {
  initChatEvents();
});

const EDGE_FUNCTION_URL =
  "https://scyivawhhetzwucvfrwe.supabase.co/functions/v1/smart-search-shsd";

let isSendingMessage = false;

function initChatEvents() {
  const sendButton = document.getElementById("btn-send-msg");
  const inputField = document.getElementById("user-input-msg");
  const resetButton = document.getElementById("btn-reset-chat");

  if (!sendButton || !inputField) {
    console.error("Elemen chat Tanya asisten tidak ditemukan.");
    return;
  }

  sendButton.addEventListener("click", handleSendMessage);

  inputField.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  });

  resetButton?.addEventListener("click", resetChat);
}

async function handleSendMessage() {
  const inputField = document.getElementById("user-input-msg");
  const messagesContainer = document.getElementById(
    "chat-messages-container"
  );
  const sendButton = document.getElementById("btn-send-msg");

  if (!inputField || !messagesContainer || isSendingMessage) return;

  const message = inputField.value.trim();

  if (!message) return;

  if (message.length > 150) {
    appendSystemMessage(
      "Kebutuhan maksimal 150 karakter. Silakan ringkas permintaanmu."
    );
    return;
  }

  const client = window.supabaseClient;

  if (!client) {
    appendSystemMessage(
      "Koneksi aplikasi belum siap. Silakan muat ulang halaman."
    );
    return;
  }

  isSendingMessage = true;
  inputField.disabled = true;

  if (sendButton) sendButton.disabled = true;

  appendUserMessage(message);
  inputField.value = "";

  const loadingElement = appendLoadingMessage();

  try {
    const {
      data: { session },
      error: sessionError
    } = await client.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session?.access_token) {
      throw new Error(
        "Sesi login tidak ditemukan. Silakan login kembali."
      );
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeWl2YXdoaGV0end1Y3ZmcndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0NDk5ODYsImV4cCI6MjEwODAyNTk4Nn0.YiYe9-hB4oRhiintiO9Ht-zZdSe_4U_qTMt9AtXjbFw"
      },
      body: JSON.stringify({ query: message })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || "Pencarian barang gagal dilakukan."
      );
    }

    if (!result.success) {
      throw new Error(
        result.error || "Hasil pencarian tidak dapat diproses."
      );
    }

    loadingElement.remove();

    if (!Array.isArray(result.results) || result.results.length === 0) {
      appendSystemMessage(
        result.message ||
          "Belum ditemukan barang yang cocok. Coba gunakan kata kunci lain."
      );
    } else {
      appendRecommendationMessage(result.results);
    }
  } catch (error) {
    loadingElement.remove();

    appendSystemMessage(
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan. Silakan coba lagi."
    );

    console.error("Tanya asisten gagal:", error);
  } finally {
    isSendingMessage = false;
    inputField.disabled = false;

    if (sendButton) sendButton.disabled = false;

    inputField.focus();
    scrollChatToBottom();
  }
}

function appendUserMessage(text) {
  const container = document.getElementById(
    "chat-messages-container"
  );

  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.className = "chat-message user";

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.textContent = "Anda";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = text;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);

  scrollChatToBottom();
}

function appendSystemMessage(text) {
  const container = document.getElementById(
    "chat-messages-container"
  );

  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.className = "chat-message asisten";

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.textContent = "Aspri";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = text;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);

  scrollChatToBottom();
}

function appendLoadingMessage() {
  const container = document.getElementById(
    "chat-messages-container"
  );

  const wrapper = document.createElement("div");
  wrapper.className = "chat-message asisten";

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.textContent = "Aspri";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = "Sedang mencari rekomendasi barang...";

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);

  scrollChatToBottom();

  return wrapper;
}

function appendRecommendationMessage(items) {
  const container = document.getElementById(
    "chat-messages-container"
  );

  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.className = "chat-message asisten";

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.textContent = "Aspri";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";

  const intro = document.createElement("p");
  intro.textContent =
    "Berikut rekomendasi barang SHSD yang dapat dipertimbangkan. " +
    "Silakan periksa kembali kesesuaiannya dengan kebutuhan.";
  bubble.appendChild(intro);

  const grid = document.createElement("div");
  grid.className = "recommendation-card-grid";

  items.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "rec-item-card";

    const title = document.createElement("div");
    title.className = "rec-item-title";
    title.textContent = `${index + 1}. ${item.nama_barang ?? "Nama barang tidak tersedia"}`;
    card.appendChild(title);

    if (item.tipe_merk) {
      const type = document.createElement("div");
      type.className = "rec-item-meta";
      type.textContent = `Tipe/Merk: ${item.tipe_merk}`;
      card.appendChild(type);
    }

    const unit = document.createElement("div");
    unit.className = "rec-item-meta";
    unit.textContent = `Satuan: ${item.satuan ?? "-"}`;
    card.appendChild(unit);

    const price = document.createElement("div");
    price.className = "rec-item-price";
    price.textContent = `Harga referensi: ${formatRupiah(item.harga_referensi)}`;
    card.appendChild(price);

    const code = document.createElement("div");
    code.className = "rec-item-meta";
    code.textContent = `Kode barang/jasa: ${item.kode_barang_jasa ?? "-"}`;
    card.appendChild(code);

    if (item.reason) {
      const reason = document.createElement("div");
      reason.className = "rec-item-meta";
      reason.textContent = `Alasan rekomendasi: ${item.reason}`;
      card.appendChild(reason);
    }

    grid.appendChild(card);
  });

  bubble.appendChild(grid);

  const note = document.createElement("p");
  note.style.marginTop = "0.75rem";
  note.style.fontSize = "11px";
  note.style.color = "var(--color-text-secondary)";
  note.textContent =
    "Rekomendasi ini merupakan alat bantu penyusunan usulan, " +
    "bukan persetujuan akhir. Verifikator akan memeriksa kesesuaian usulan.";
  bubble.appendChild(note);

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);

  scrollChatToBottom();
}

function formatRupiah(value) {
  if (value === null || value === undefined || value === "") {
    return "Tidak tersedia";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "Tidak tersedia";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

function resetChat() {
  if (
    !window.confirm("Hapus percakapan yang tampil saat ini?")
  ) {
    return;
  }

  const container = document.getElementById(
    "chat-messages-container"
  );

  if (!container) return;

  container.replaceChildren();

  const wrapper = document.createElement("div");
  wrapper.className = "chat-message asisten";

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.textContent = "Aspri";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent =
    "Halo! Saya siap membantu mencari rekomendasi barang SHSD. " +
    "Ceritakan barang yang dibutuhkan.";

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
}

function scrollChatToBottom() {
  const container = document.getElementById(
    "chat-messages-container"
  );

  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}