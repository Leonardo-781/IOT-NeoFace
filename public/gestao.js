const managementIntro = document.getElementById('managementIntro');
const managementUser = document.getElementById('managementUser');
const managementRole = document.getElementById('managementRole');
const managementAccess = document.getElementById('managementAccess');
const accessDenied = document.getElementById('accessDenied');
const managementContent = document.getElementById('managementContent');
const usersCount = document.getElementById('usersCount');
const usersList = document.getElementById('usersList');
const userCreateForm = document.getElementById('userCreateForm');
const userFormFeedback = document.getElementById('userFormFeedback');
const newUsername = document.getElementById('newUsername');
const newDisplayName = document.getElementById('newDisplayName');
const newPassword = document.getElementById('newPassword');
const newRole = document.getElementById('newRole');
const logoutLinks = document.querySelectorAll('.logout-link');

let currentUser = null;
let cachedUsers = [];

function getRoleLabel(role) {
  return role === 'admin' ? 'gestor' : role;
}

function safeText(value) {
  return String(value || '').replace(/[&<>"']/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}

function updateHeader() {
  if (!currentUser) {
    return;
  }
  managementUser.textContent = currentUser.displayName || currentUser.username;
  managementRole.textContent = getRoleLabel(currentUser.role);
  managementAccess.textContent = currentUser.canManageAccounts ? 'Liberado' : 'Bloqueado';
  managementIntro.textContent = currentUser.canManageAccounts
    ? 'Aqui você gerencia as contas autorizadas para o sistema.'
    : 'Seu usuário foi autenticado, mas não possui permissão para esta área.';
}

function renderUsers(users) {
  cachedUsers = users || [];
  usersCount.textContent = String(cachedUsers.length);

  if (!cachedUsers.length) {
    usersList.innerHTML = '<article class="card"><div class="meta">Nenhuma conta cadastrada.</div></article>';
    return;
  }

  usersList.innerHTML = cachedUsers
    .map(
      (user) => `
        <article class="card user-card" data-user-id="${safeText(user.id)}">
          <div class="user-card-top">
            <strong>${safeText(user.displayName || user.username)}</strong>
            <div class="user-roles">
              <span class="pill ${safeText(user.role)}">${safeText(getRoleLabel(user.role))}</span>
              <span class="pill ${user.active ? 'active' : 'inactive'}">${user.active ? 'ativo' : 'inativo'}</span>
            </div>
          </div>
          <div class="meta">@${safeText(user.username)} · criado em ${safeText(user.createdAt)}</div>
          <div class="user-card-actions">
            <input class="user-display-name" type="text" value="${safeText(user.displayName || '')}" placeholder="Nome exibido" />
            <select class="user-role">
              <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>viewer</option>
              <option value="operator" ${user.role === 'operator' ? 'selected' : ''}>operator</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>gestor</option>
            </select>
            <input class="user-password" type="password" placeholder="Nova senha" />
            <label class="meta" style="display:flex;align-items:center;gap:8px;">
              <input class="user-active" type="checkbox" ${user.active ? 'checked' : ''} />
              ativo
            </label>
            <button type="button" class="secondary user-save">Salvar</button>
            <button type="button" class="secondary user-delete">Remover</button>
          </div>
        </article>
      `
    )
    .join('');

  usersList.querySelectorAll('.user-save').forEach((button) => {
    button.addEventListener('click', saveUserFromCard);
  });
  usersList.querySelectorAll('.user-delete').forEach((button) => {
    button.addEventListener('click', deleteUserFromCard);
  });
}

async function fetchSession() {
  const response = await fetch('/api/me');
  if (response.status === 401) {
    window.location.href = '/login';
    return null;
  }

  const data = await response.json();
  currentUser = data.user;
  updateHeader();

  if (!currentUser?.canManageAccounts) {
    accessDenied.hidden = false;
    managementContent.hidden = true;
    return currentUser;
  }

  accessDenied.hidden = true;
  managementContent.hidden = false;
  return currentUser;
}

async function fetchUsers() {
  const response = await fetch('/api/users');
  if (!response.ok) {
    userFormFeedback.textContent = 'Falha ao carregar usuários';
    return;
  }

  const data = await response.json();
  renderUsers(data.users || []);
}

async function submitNewUser(event) {
  event.preventDefault();
  userFormFeedback.textContent = 'Criando...';

  const payload = {
    username: newUsername.value.trim(),
    displayName: newDisplayName.value.trim(),
    password: newPassword.value,
    role: newRole.value
  };

  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    userFormFeedback.textContent = error.error || 'Falha ao cadastrar usuário';
    return;
  }

  userCreateForm.reset();
  newRole.value = 'viewer';
  userFormFeedback.textContent = 'Usuário cadastrado';
  await fetchUsers();
}

async function saveUserFromCard(event) {
  const card = event.target.closest('.user-card');
  if (!card) {
    return;
  }

  const userId = card.dataset.userId;
  const payload = {
    displayName: card.querySelector('.user-display-name').value,
    role: card.querySelector('.user-role').value,
    active: card.querySelector('.user-active').checked
  };

  const password = card.querySelector('.user-password').value.trim();
  if (password) {
    payload.password = password;
  }

  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    userFormFeedback.textContent = error.error || 'Falha ao salvar usuário';
    return;
  }

  userFormFeedback.textContent = 'Usuário atualizado';
  await fetchUsers();
}

async function deleteUserFromCard(event) {
  const card = event.target.closest('.user-card');
  if (!card) {
    return;
  }

  const userId = card.dataset.userId;
  const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json();
    userFormFeedback.textContent = error.error || 'Falha ao remover usuário';
    return;
  }

  userFormFeedback.textContent = 'Usuário removido';
  await fetchUsers();
}

userCreateForm.addEventListener('submit', submitNewUser);

logoutLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.assign('/logout');
  });
});

(async function boot() {
  await fetchSession();
  if (currentUser?.canManageAccounts) {
    await fetchUsers();
  }
})();
