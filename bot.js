const Discord = require('discord.js');
const {transports, createLogger, format} = require('winston');
const auth = require('./auth.json');
const ids = require('./ids.json');
const schedule = require('node-schedule');
const ffmpeg = require('ffmpeg');
const insults = require('./insults.js');
const snekfetch = require('snekfetch');

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

// Initialize Discord client
var client = new Discord.Client();
client.login(auth.token);
client.on('ready', () => {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(client.user.username + ' - (' + client.user.id + ')');
    client.user.setPresence({ game: { name: 'god', type: 0 } });

	// if bot is started between 1 am and noon, schedule a ping
	var date = new Date();
	if (date.getHours() > 0 && date.getHours() < 12) {
		schedulePing();
	}

	// schedule the ping
	var a = schedule.scheduleJob('0 1 * * *', () => {schedulePing()});
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
				message.channel.send('Beep beep, ' + message.author.username);
				break;
			case 'test':
				logger.info(message.author.username + ' did a command test');
				var temp = message.channel.send('This channel is '  + message.channel.name)
					.then((msg) => {msg.delete(1000)});
				break;
			case 'connect':
				var voiceChannel = message.member.voiceChannel;
				if (typeof voiceChannel == "undefined") {
					client.guilds.get(ids.guildid).channels.get(ids.voicechannelid).join();
				} else {
					voiceChannel.join();
				}
				logger.info(message.author.username + ' made the bot join ' + client.voiceConnections.first().channel.name);
				break;
			case 'leave':
				logger.info(message.author.username + ' made the bot leave ' + client.voiceConnections.first().channel.name);
				client.voiceConnections.first().disconnect();
				break;
			case 'curse':
				curseFetch(message);
				logger.info(message.author.username + ' cursed themself');
				break;
			case 'subfetch':
				var url = subImageFetch(message, args[0])
					.then(post => {
						if (post.length > 0) { 
							logger.info(message.author.username + ' fetched an image from /r/' + args[0]);
							message.channel.send({
								files:
								[post]
							})
						} else {
							logger.info(message.author.username + ' failed to fetch an image from /r/' + args[0]);
							message.channel.send('no posts found, fuck off')
						}
					});
				break;
            // Just add any case commands if you want to..
		}
	} else if (message.content.includes('<@621857544779988992>')) {
		message.channel.send(insults[Math.floor(Math.random()*insults.length)]);
	}
});

function schedulePing() {
	var randHour = Math.floor(Math.random() * (18 - 12) + 12);
	var randMin = Math.floor(Math.random() * 59);

	// schedule ping
	if (typeof dailyjob == "undefined") {
		var dailyjob = schedule.scheduleJob({hour: randHour, minute: randMin}, () => {
			client.guilds.get(ids.guildid).channels.get(ids.channelid).send("<@" + ids.userid + ">", {
				files: [{
					attachment: 'unnamed.jpg',
					name: 'unnamed.jpg'
				}]
			})
				.then(logger.info('Sent ping to poser'))
				.catch(console.error);
		});
		logger.info('The message today will be at ');
		logger.info(dailyjob.nextInvocation());

	} else {

		dailyjob.reschedule({hour: randHour, minute: randMin});
		logger.info('The message today will be at ');
		logger.info(dailyjob.nextInvocation());
	}
}

async function subImageFetch(message, sub) {
	try {
        const { body } = await snekfetch
            .get('https://api.reddit.com/r/' + sub + '.json?sort=top&t=week&limit=100')
            .query({ limit: 800 });
        var posts = message.channel.nsfw ? body.data.children : body.data.children.filter(post => !post.data.over_18);
		posts = posts.filter(post => !post.data.selftext.length);
		posts = posts.filter(post => (post.data.url.endsWith('.jpg') || post.data.url.endsWith('.png') || post.data.url.endsWith('.gif')));
        if (!posts.length) return '';
        const randomnumber = Math.floor(Math.random() * posts.length);
        return posts[randomnumber].data.url;
    } catch (err) {
		return '';
    }
}

async function curseFetch(message) {
	try {
        const { body } = await snekfetch
            .get('https://api.reddit.com/r/cursedimages.json?sort=top&t=week&limit=100')
            .query({ limit: 800 });
        var posts = message.channel.nsfw ? body.data.children : body.data.children.filter(post => !post.data.over_18);
		posts.filter(post => !post.data.selftext.length);
        if (!posts.length) return message.channel.send('It seems we are out of cursed images, Try again later.');
        const randomnumber = Math.floor(Math.random() * posts.length);
        message.channel.send({
			files:
			[posts[randomnumber].data.url]
		});
    } catch (err) {
        return console.log(err);
    }
}