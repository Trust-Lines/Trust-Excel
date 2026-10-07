// Full Chrome is only needed for local PDF rendering; on Vercel the
// serverless build of Chromium (@sparticuz/chromium) is used instead.
module.exports = {
  skipDownload: !!process.env.VERCEL,
};
