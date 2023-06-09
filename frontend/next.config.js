module.exports = {
  reactStrictMode: true,
  rewrites: async () => {
    return [
      {
        source: "/landing",
        destination: "/landing/index.html",
      }
    ]
  }
}
