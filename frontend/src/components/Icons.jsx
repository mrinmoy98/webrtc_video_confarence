const S = ({ children, ...p }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

export const MicOn = () => <S><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><path d="M12 18v4" /></S>;
export const MicOff = () => <S><path d="M9 9v2a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" /><path d="M19 10v1a7 7 0 0 1-.11 1.23" /><path d="M5 10v1a7 7 0 0 0 10.91 5.8" /><path d="M12 18v4" /><path d="m2 2 20 20" /></S>;
export const CamOn = () => <S><rect x="2" y="6" width="14" height="12" rx="2" /><path d="m22 8-6 4 6 4V8Z" /></S>;
export const CamOff = () => <S><path d="M16 16v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" /><path d="M10 6h4a2 2 0 0 1 2 2v2.5l4-2.5v8" /><path d="m2 2 20 20" /></S>;
export const Screen = () => <S><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><path d="m9 10 3-3 3 3M12 7v6" /></S>;
export const Smile = () => <S><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01M15 9h.01" /></S>;
export const Hand = () => <S><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v7M10 10.5V6a2 2 0 0 0-4 0v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-7-4l-2.5-4a2 2 0 0 1 3.4-2L7 14" /></S>;
export const Captions = () => <S><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M7 12h2M7 15h4M13 12h4M15 15h2" /></S>;
export const Record = () => <S><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /></S>;
export const Chat = () => <S><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" /></S>;
export const People = () => <S><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" /></S>;
export const Expand = () => <S><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></S>;
export const Collapse = () => <S><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" /></S>;
export const Gear = () => <S><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></S>;
export const Phone = () => <S><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.29.6 2 2 0 0 1 1.72 2v2.18a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.07 5.18 2 2 0 0 1 5 3h2.18a2 2 0 0 1 2 1.72c.13.81.34 1.6.6 2.29a2 2 0 0 1-.45 2.11L8.06 9.4" transform="rotate(135 12 12)" /></S>;
export const Pin = () => <S><path d="M12 17v5" /><path d="M9 10.76V4h6v6.76a2 2 0 0 0 .59 1.42l1.41 1.41a1 1 0 0 1-.71 1.71H7.71a1 1 0 0 1-.71-1.71l1.41-1.41A2 2 0 0 0 9 10.76Z" /></S>;
export const Check = () => <S><path d="M20 6 9 17l-5-5" /></S>;
export const X = () => <S><path d="M18 6 6 18M6 6l12 12" /></S>;
export const Crown = () => <S><path d="M3 7l4 4 5-6 5 6 4-4-2 12H5L3 7Z" /></S>;
export const Copy = () => <S><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></S>;
export const Speaker = () => <S><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" /></S>;
