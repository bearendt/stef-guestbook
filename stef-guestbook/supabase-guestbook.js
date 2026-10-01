(() => {
  const configReady =
    window.STEF_SUPABASE_URL &&
    window.STEF_SUPABASE_KEY &&
    !window.STEF_SUPABASE_URL.startsWith("YOUR_") &&
    !window.STEF_SUPABASE_KEY.startsWith("YOUR_");

  const form = document.querySelector(".memory-form");
  const grid = document.querySelector(".memory-grid");
  if (!form || !grid) return;

  const colors = ["memory-mist","memory-cream","memory-peach","memory-sage","memory-blue","memory-lavender","memory-rose","memory-sand"];

  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  const addShowMore = (article) => {
    if (article.querySelector(".memory-expand")) return;

    const textBlocks = [...article.querySelectorAll(".memory-text")];
    const totalLength = textBlocks.reduce((sum, block) => sum + block.textContent.trim().length, 0);
    if (totalLength < 300) return;

    const content = document.createElement("div");
    content.className = "memory-content";
    const firstText = textBlocks[0];
    firstText.parentNode.insertBefore(content, firstText);
    textBlocks.forEach((block) => content.appendChild(block));

    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-expand";
    button.textContent = "Show more";
    button.setAttribute("aria-expanded", "false");

    button.addEventListener("click", () => {
      const expanded = article.classList.toggle("memory-expanded");
      button.textContent = expanded ? "Show less" : "Show more";
      button.setAttribute("aria-expanded", String(expanded));
    });

    const meta = article.querySelector(".memory-meta");
    meta ? article.insertBefore(button, meta) : article.appendChild(button);
  };

  const enhanceExistingMemories = () => {
    grid.querySelectorAll(".memory-card").forEach(addShowMore);
  };

  const createMemoryCard = (memory, isNew = false) => {
    const article = document.createElement("article");
    article.className = `memory-card submitted-memory ${colors[Math.floor(Math.random() * colors.length)]}`;
    if (isNew) article.classList.add("memory-new");

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = "A memory from her people";
    article.appendChild(tag);

    const text = document.createElement("p");
    text.className = "memory-text";
    text.textContent = memory.memory;
    article.appendChild(text);

    if (memory.photo_url) {
      const photoUrl = safeUrl(memory.photo_url);
      if (photoUrl) {
        const img = document.createElement("img");
        img.className = "submitted-memory-photo";
        img.src = photoUrl;
        img.alt = `Photo shared by ${memory.name || "a friend of Stef"}`;
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        article.appendChild(img);
      }
    }

    const meta = document.createElement("div");
    meta.className = "memory-meta";
    meta.textContent = [memory.name, memory.connection, memory.location].filter(Boolean).join(" · ");
    article.appendChild(meta);
    addShowMore(article);
    return article;
  };

  const insertNewMemory = (memory) => {
    const firstSubmitted = grid.querySelector(".submitted-memory");
    const card = createMemoryCard(memory, true);
    firstSubmitted ? grid.insertBefore(card, firstSubmitted) : grid.prepend(card);
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const showStatus = (message, type = "info") => {
    let status = form.querySelector(".memory-form-status");
    if (!status) {
      status = document.createElement("p");
      status.className = "memory-form-status";
      form.appendChild(status);
    }
    status.textContent = message;
    status.dataset.type = type;
  };

  const setSubmitting = (submitting) => {
    const button = form.querySelector("button[type='submit']");
    if (!button) return;
    button.disabled = submitting;
    button.textContent = submitting ? "Adding your memory…" : "Add this memory";
  };

  enhanceExistingMemories();

  if (!configReady || !window.supabase) {
    showStatus("The guest book is being connected. Please try again shortly.", "error");
    return;
  }

  const client = window.supabase.createClient(window.STEF_SUPABASE_URL, window.STEF_SUPABASE_KEY);

  const loadMemories = async () => {
    const { data, error } = await client
      .from("memories")
      .select("id,name,connection,location,memory,photo_url,created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load submitted memories:", error);
      return;
    }
    data.forEach((memory) => grid.prepend(createMemoryCard(memory)));
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      connection: String(data.get("connection") || "").trim(),
      location: String(data.get("location") || "").trim() || null,
      memory: String(data.get("memory") || "").trim(),
      photo_url: String(data.get("photo_url") || "").trim() || null,
      permission: data.get("permission") === "yes",
      published: true
    };

    if (!payload.name || !payload.connection || !payload.memory || !payload.permission) {
      showStatus("Please complete the required fields and give permission to share the memory.", "error");
      return;
    }

    setSubmitting(true);
    showStatus("");

    const { data: inserted, error } = await client
      .from("memories")
      .insert(payload)
      .select("id,name,connection,location,memory,photo_url,created_at")
      .single();

    if (error) {
      console.error("Could not save memory:", error);
      showStatus("We couldn't save that memory just now. Please try again.", "error");
      setSubmitting(false);
      return;
    }

    form.reset();
    setSubmitting(false);
    showStatus("Your memory is now part of Stef's guest book. Thank you.", "success");
    insertNewMemory(inserted);
  });

  loadMemories();
})();
