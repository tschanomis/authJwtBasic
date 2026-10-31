const { hashPassword } = require('./password');

// Read from stdin, never from command-line arguments or a checked-in file.
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', async () => {
  const password = input.replace(/\r?\n$/, '');
  if (password.length < 15 || Buffer.byteLength(password) > 1024) {
    console.error('Use a password of at least 15 characters and at most 1024 bytes');
    process.exitCode = 1;
    return;
  }
  try {
    console.log(await hashPassword(password));
  } catch {
    console.error('Password hashing failed');
    process.exitCode = 1;
  }
});
