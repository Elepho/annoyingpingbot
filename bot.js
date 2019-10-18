const Discord = require('discord.js');
const {transports, createLogger, format} = require('winston');
const auth = require('./auth.json');
const ids = require('./ids.json');
const schedule = require('node-schedule');
const ffmpeg = require('ffmpeg');
const insults = require('./insults.js');
const fetch = require('node-fetch');
const ud = require('urban-dictionary');

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

client.on('message', async message => {
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
			case 'oof':
				const eheeah = client.emojis.get("598930147470606356");
				const f_emoji = client.emojis.find(emoji => emoji.name === "regional_indicator_f");
				message.channel.send(eheeah + eheeah + '🇫')
					.then(logger.info(message.author.username + ' oofed'));
				break;
			/*
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
				var url = await subImageFetch(message, 'cursedimages')
					.then(url => {
						if (url.length > 0) { 
							logger.info(message.author.username + ' cursed themself');
							message.channel.send({
								files:
								[url]
							})
						} else {
							message.channel.send('no posts found, fuck off')
						}
					});
				break;
			case 'sf':
			case 'subfetch':
				var url = await subImageFetch(message, args[0])
					.then(url => {
						if (url.length > 0) { 
							logger.info(message.author.username + ' fetched an image from /r/' + args[0]);
							message.channel.send({
								files:
								[url]
							})
						} else {
							logger.info(message.author.username + ' failed to fetch an image from /r/' + args[0]);
							message.channel.send('no posts found, fuck off')
						}
					});
				break;
			case 'ud':
			case 'urbandictionary':
				word = args[0];
				entryNum = 0;
				if (args.length == 2) {
					entryNum = args[1] - 1;
				};
				ud.term(args[0])
					.then(result => {
						const entry = result.entries[entryNum];
						var embed = new Discord.RichEmbed()
							.setColor('#ff4000')
							.setTitle(entry.word)
							.setDescription(entry.definition.replace(/[\[\]]/g, ''))
							.setFooter(entry.example.replace(/[\[\]]/g, ''));
						message.channel.send(embed)
							.then(logger.info(message.author.username + ' search for the definition of the word ' + entry.word))
							.catch(error => {logger.info(error)});
					
						})
					.catch(error => {logger.info(error)});
				break;
			case 'scheduledjobs':
				var count = 0;
				for (x in schedule.scheduledJobs) {
					count++;
				}
				message.channel.send(count);
				
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
	var role = client.guilds.get('109074432814743552').roles.get('631202481493377034');

	// schedule ping
	if (typeof dailyjob == "undefined") {
		
		var dailyjob = schedule.scheduleJob({hour: randHour, minute: randMin}, () => {
			client.guilds.get(ids.guildid).channels.get(ids.channelid).send('<@' + ids.userid + '> aaaaaaaaaaaa')
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
        const json = await fetch('https://api.reddit.com/r/' + sub + '.json?sort=top&t=week&limit=100')
				.then(res => res.json());
		//const json = await response.json();
		var posts = message.channel.nsfw ? json.data.children : json.data.children.filter(post => !post.data.over_18)
		posts = posts.filter(post => !post.data.selftext.length);
		posts = posts.filter(post => (post.data.url.endsWith('.jpg') || post.data.url.endsWith('.png') || post.data.url.endsWith('.gif')));
		if (!posts.length) return '';
		const randomnumber = Math.floor(Math.random() * posts.length);
		return posts[randomnumber].data.url;
    } catch (err) {
		return '';
    }
}