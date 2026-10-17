const STICKERS = [...'🌸🌻🌈🦋🐞🐝🐠🐳🦄🐰🐱🐶🦊🐨🐯🦁🐸🐧🦉🐙🍓🍉🍒🍑🍭🍩🧁🎈🎀🪁🚀⭐🌙☀️🍀🍄🌵🎵🐬🦜']
  .filter((c) => c.trim() && c !== '️')

export const stickerFor = (char) => STICKERS[char.codePointAt(0) % STICKERS.length]
