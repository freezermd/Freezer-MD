const settings = require('./lib/settings');

console.log(settings.getSettings());

console.log(settings.get("autoTyping"));

settings.toggle("autoTyping");

console.log(settings.get("autoTyping"));
