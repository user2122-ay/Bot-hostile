async function obtenerUsuarioRoblox(username) {
  const res = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });
  const data = await res.json();
  if (!data.data || data.data.length === 0) return null;
  return data.data[0]; // { id, name, displayName }
}

async function obtenerDescripcionRoblox(robloxUserId) {
  const res = await fetch(`https://users.roblox.com/v1/users/${robloxUserId}`);
  const data = await res.json();
  return data.description ?? '';
}

// "avatar-bust" = de pecho hacia arriba (lo que pediste)
async function obtenerAvatarBustoRoblox(robloxUserId) {
  const res = await fetch(
    `https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${robloxUserId}&size=420x420&format=Png&isCircular=false`,
  );
  const data = await res.json();
  return data.data?.[0]?.imageUrl ?? null;
}

module.exports = { obtenerUsuarioRoblox, obtenerDescripcionRoblox, obtenerAvatarBustoRoblox };
