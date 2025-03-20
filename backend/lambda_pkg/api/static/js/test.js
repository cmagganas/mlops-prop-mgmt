document.addEventListener('DOMContentLoaded', function() {
  const button = document.getElementById('testButton');
  const result = document.getElementById('result');
  
  button.addEventListener('click', function() {
    result.textContent = 'JavaScript is working! Button clicked at ' + new Date().toLocaleTimeString();
  });
  
  console.log('Page loaded with correct JavaScript file');
});
