const Discord = require('discord.js');
const {transports, createLogger, format} = require('winston');
const auth = require('./auth.json');
const ids = require('./ids.json');
const schedule = require('node-schedule');
const ffmpeg = require('ffmpeg');
const insults = require('./insults.js');

// Configure logger settings, note the logger timestamps are in utc + 0
const logger = createLogger({
        format: format.combine(
            format.timestamp(),
            format.simple()
        ),
        transports: [
            new transports.Console(),
		]
    });
logger.level = 'debug';

var scheduled = false;

// Initialize Discord client
const client = new Discord.Client();
client.login(auth.token);
client.on('ready', () => {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(client.user.username + ' - (' + client.user.id + ')');
    client.user.setPresence({ game: { name: 'owo *notices poser*', type: 0 } });

	// define rule of when to schedule daily ping (currently 1 am)
	var rule = new schedule.RecurrenceRule();
	rule.minute = 0;
	rule.hour = 1;

	// schedule the ping
	var a = schedule.scheduleJob(rule, () => {

		//pick a random time between noon and 6 pm
		var randHour = Math.floor(Math.random() * (18 - 12) + 12);
		var randMin = Math.floor(Math.random() * 59);
		
		// schedule ping
		if (!scheduled) {
			var dailyjob = schedule.scheduleJob({hour: randHour, minute: randMin}, () => {
				client.guilds.get(ids.guildid).channels.get(ids.channelid).send('owo *notices <@' + ids.userid + '>*')
					.then(logger.info('Sent ping to poser'))
					.catch(console.error);
			});
			logger.info('The message today will be at ');
			logger.info(dailyjob.nextInvocation());
			scheduled = true;
		} else {
			
			dailyjob.reschedule({hour: randHour, minute: randMin});
			logger.info('The message today will be at ');
			logger.info(dailyjob.nextInvocation());
		}
	});
});

client.on('message', message => {
    // check for command character and remove it
    if (message.content.substring(0, 1) == '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
			case '🏓':
			case 'ping':
				logger.info(message.author.username + ' pinged');
				message.channel.send('Pong!');
				break;
			case 'annoy':
				logger.info(message.author.username + ' played themself');
				message.channel.send('<@' + message.author.id + '> is a ninny');
				break;
			case 'test':
				logger.info(message.author.username + ' did a command test');
				var currentchannel = client.guilds.get(ids.guildid).channels.get(ids.testchannelid);
				currentchannel.send('This channel is '  + currentchannel.name);
				break;
			case 'connect':
				client.guilds.get(ids.guildid).channels.get(ids.voicechannelid).join();
				break;
			case 'leave':
				client.guilds.get(ids.guildid).channels.get(ids.voicechannelid).leave();
				break;
            // Just add any case commands if you want to..
		}
	} else if (message.content.includes('<@621857544779988992>')) {
		message.channel.send(insults[Math.floor(Math.random()*insults.length)]);
	}
});


	