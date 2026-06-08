/** Iniciais: primeiro nome + último sobrenome */
export function getDisplayInitials(name?: string | null): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function isPlaceholderAvatar(url?: string | null): boolean {
  if (!url?.trim()) return true;
  const u = url.trim().toLowerCase();
  return u.includes('dicebear.com') || u.includes('api.dicebear');
}

export function resolveAvatarSrc(url?: string | null): string | undefined {
  if (isPlaceholderAvatar(url)) return undefined;
  return url || undefined;
}

const MAX_AVATAR_PX = 320;

export function resizeImageToDataUrl(file: File, callback: (dataUrl: string) => void): void {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_AVATAR_PX) {
          height *= MAX_AVATAR_PX / width;
          width = MAX_AVATAR_PX;
        }
      } else if (height > MAX_AVATAR_PX) {
        width *= MAX_AVATAR_PX / height;
        height = MAX_AVATAR_PX;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}
