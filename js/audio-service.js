async function enviarAudioPrivado(denunciaId, blob, userId) { if (!blob) return null; const extension = blob.type.includes('mp4') ? 'm4a' : 'webm'; const path = `${userId}/${denunciaId}.${extension}`; if (!window.supabaseClient?.storage) return `mock://denuncia-audios/${path}`; const { error } = await window.supabaseClient.storage.from('denuncia-audios').upload(path, blob, { contentType: blob.type, upsert: false }); if (error) throw error; return path; }
window.enviarAudioPrivado = enviarAudioPrivado;
async function obterAudioPrivado(path) {
	if (!path || !window.supabaseClient?.storage || path.startsWith('mock://')) return null;
	const { data, error } = await window.supabaseClient.storage.from('denuncia-audios').createSignedUrl(path, 300);
	if (error) throw error;
	return data?.signedUrl || null;
}
window.obterAudioPrivado = obterAudioPrivado;
