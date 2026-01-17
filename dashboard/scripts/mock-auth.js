// Quick script to mock authentication for development
// Run this in browser console (F12) when on localhost:3000

console.log('🔧 Setting up mock authentication...')

// Set mock auth token
localStorage.setItem('auth_token', 'dev-token-' + Date.now())

// Set mock user data
localStorage.setItem('auth_user', JSON.stringify({
  id: 'dev-user-1',
  email: 'dev@example.com',
  name: 'Development User',
  username: 'devuser',
  github_id: '12345'
}))

console.log('✅ Mock authentication set!')
console.log('🔄 Refreshing page...')

// Refresh the page
setTimeout(() => {
  window.location.reload()
}, 500)
