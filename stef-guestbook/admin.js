(() => {
  const configReady =
    window.STEF_SUPABASE_URL &&
    window.STEF_SUPABASE_KEY &&
    !window.STEF_SUPABASE_URL.startsWith("YOUR_") &&
    !window.STEF_SUPABASE_KEY.startsWith("YOUR_");

  const loginPanel = document.querySelector("#login-panel");
  const managePanel = document.querySelector("#manage-panel");
  const loginForm = document.querySelector("#login-form");
  const loginStatus = document.querySelector("#login-status");
  const manageStatus = document.querySelector("#manage-status");
  const list = document.querySelector("#admin-memories");
  const signOut = document.querySelector("#sign-out");

  if (!configReady || !window.supabase) {
    loginStatus.textContent = "Supabase is not configured yet.";
    loginStatus.dataset.type = "error";
    return;
  }

  const client = window.supabase.createClient(window.STEF_SUPABASE_URL, window.STEF_SUPABASE_KEY);

  const status = (element, message, type = "info") => {
    element.textContent = message;
    element.dataset.type = type;
  };

  const renderMemory = (memory) => {
    const article = document.createElement("article");
    article.className = "admin-memory";

    const content = document.createElement("div");
    content.className = "admin-memory-content";

    const meta = document.createElement("p");
    meta.className = "admin-memory-meta";
    meta.textContent = [
      memory.name, memory.connection, memory.location,
      new Date(memory.created_at).toLocaleString()
    ].filter(Boolean).join(" · ");

    const state = document.createElement("span");
    state.className = "admin-memory-state";
    state.textContent = memory.published ? "Published" : "Hidden";

    const text = document.createElement("p");
    text.className = "admin-memory-text";
    text.textContent = memory.memory;

    content.append(meta, state, text);

    if (memory.photo_url) {
      const photo = document.createElement("a");
      photo.href = memory.photo_url;
      photo.target = "_blank";
      photo.rel = "noopener";
      photo.textContent = "View shared photo";
      photo.className = "admin-photo-link";
      content.appendChild(photo);
    }

    const actions = document.createElement("div");
    actions.className = "admin-memory-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "button button-outline";
    toggle.textContent = memory.published ? "Hide" : "Publish";
    toggle.addEventListener("click", async () => {
      toggle.disabled = true;
      const nextPublished = !memory.published;
      const { error } = await client.from("memories")
        .update({ published: nextPublished }).eq("id", memory.id);

      if (error) {
        status(manageStatus, "Couldn't update that memory. " + error.message, "error");
        toggle.disabled = false;
        return;
      }
      memory.published = nextPublished;
      state.textContent = nextPublished ? "Published" : "Hidden";
      toggle.textContent = nextPublished ? "Hide" : "Publish";
      toggle.disabled = false;
      status(manageStatus, nextPublished ? "Memory published." : "Memory hidden.", "success");
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button button-danger";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      if (!window.confirm("Permanently delete this memory? This cannot be undone.")) return;
      remove.disabled = true;
      const { error } = await client.from("memories").delete().eq("id", memory.id);
      if (error) {
        status(manageStatus, "Couldn't delete that memory. " + error.message, "error");
        remove.disabled = false;
        return;
      }
      article.remove();
      status(manageStatus, "Memory deleted.", "success");
    });

    actions.append(toggle, remove);
    article.append(content, actions);
    return article;
  };

  const loadMemories = async () => {
    status(manageStatus, "Loading memories...");
    const { data, error } = await client.from("memories")
      .select("id,name,connection,location,memory,photo_url,published,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      status(manageStatus, "Couldn't load memories. " + error.message, "error");
      return;
    }

    list.replaceChildren();
    if (!data.length) {
      const empty = document.createElement("p");
      empty.textContent = "No memories have been submitted yet.";
      list.appendChild(empty);
    } else {
      data.forEach((memory) => list.appendChild(renderMemory(memory)));
    }
    status(manageStatus, "");
  };

  const showManage = async (session) => {
    loginPanel.hidden = !(!session);
    managePanel.hidden = !session;
    if (session) await loadMemories();
  };

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status(loginStatus, "Signing in...");
    const email = document.querySelector("#admin-email").value.trim();
    const password = document.querySelector("#admin-password").value;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      status(loginStatus, "Sign-in failed. " + error.message, "error");
      return;
    }
    status(loginStatus, "");
    await showManage(data.session);
  });

  signOut.addEventListener("click", async () => {
    await client.auth.signOut();
    loginForm.reset();
    await showManage(null);
  });

  client.auth.getSession().then(({ data }) => showManage(data.session));
})();