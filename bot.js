const Discord = require('discord.js')
const { Client, Util } = require('discord.js')
const {  PREFIX } = require('./config')
const {  GOOGLE_API_KEY } = require(process.env.GOOGLE_API_KEY)
const YouTube = require('simple-youtube-api')
const ytdl = require('ytdl-core')

const client = new Client({ disableEveryone: true })

const youtube = new YouTube(GOOGLE_API_KEY)

const queue = new Map()
const gh = require('gitinfo')
const EncryptorDecryptor = require('encrypt_decrypt');
let tempObj = new EncryptorDecryptor();



client.on('warn', console.warn)

client.on('error', console.error)

client.on('ready', () => console.log('Yo this ready!'))

client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'))

client.on('reconnecting', () => console.log('I am reconnecting now!'))

client.on('message', async msg => { // eslint-disable-line
if (msg.author.bot) return undefined
if (!msg.content.startsWith(PREFIX)) return undefined

const args = msg.content.split(' ')
let eColor = msg.guild.me.displayHexColor!=='#000000' ? msg.guild.me.displayHexColor : 0xffffff
const searchString = args.slice(1).join(' ')
const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : ''
const serverQueue = queue.get(msg.guild.id)

let command = msg.content.toLowerCase().split(' ')[0]
command = command.slice(PREFIX.length)

if(command == 'encrypt'){


if(!args[1]) return msg.channel.send('Please provide something to decrypt.');  
let encryptVal = tempObj.encrypt(args.slice(1).join(" "));
let embed = new Discord.RichEmbed()
.setTitle("Encryption")
.addField("Arguement", args.slice(1).join(" "))
.addField("Encrypted Arguement", encryptVal)
msg.channel.send(embed)

}else if(command == 'decrypt'){
if(!args[1]) return msg.channel.send('Please provide something to decrypt.');  
let encryptVal = tempObj.decrypt(args.slice(1).join(" "));
let embed = new Discord.RichEmbed()
.setTitle("Decryption")
.addField("Encrypted Arguement", args.slice(1).join(" "))
.addField("Arguement", encryptVal)
msg.channel.send(embed)

}




  

if (command === 'play') {
  const voiceChannel = msg.member.voiceChannel;
  if (!voiceChannel) return msg.channel.send('I\'m sorry but you need to be in a voice channel to play music!');
  const permissions = voiceChannel.permissionsFor(msg.client.user);
  if (!permissions.has('CONNECT')) {
    return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!');
  }
  if (!permissions.has('SPEAK')) {
    return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!');
  }

  if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
    const playlist = await youtube.getPlaylist(url);
    const videos = await playlist.getVideos();
    for (const video of Object.values(videos)) {
      const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
      await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
    }
    return msg.channel.send({embed: new Discord.RichEmbed()
                        .setAuthor(`You Requested for Music, ` + msg.author.tag,msg.author.avatarURL)
                        .setDescription(`:notes: **PlayList Added:**
**»** ${playlist.title}`)
                        .setColor(eColor)
                         
                       }); 
  } else {
    if(!searchString) {
        msg.channel.send({embed: new Discord.RichEmbed()
                        .setAuthor(`You Requested for Music, ` + msg.author.tag,msg.author.avatarURL)
                        .setDescription(`**Usage:**  t!play <search>

If you want to listen to music, you have
to put a search string ahead! That's all.`)
                        .setColor(eColor)
                         
                       });
    } else {
    try {
      var video = await youtube.getVideo(url);
    } catch (error) {
      try {
        var videos = await youtube.searchVideos(searchString, 5);
        let index = 0;
    /*  msg.channel.send({embed: new Discord.RichEmbed()
                        .setAuthor(`You Requested for Music, ` + msg.author.tag,msg.author.avatarURL)
                        .setDescription(`<:TubeMusic:413862971865956364>__**Youtube Search Result**__
${videos.map(video2 => `**${++index}.** ${video2.title}`).join(`\n`)}

To select a song, type any number from \`1 - 5\` to choose song!
The search is cancelled in \`10 seconds\` if no number provided.`)
                        .setColor(eColor)
                         
                       }); 


        try {
          var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 6, {
            maxMatches: 1,
            time: 10000,
            errors: ['time']
          });
        } catch (err) {
          console.error(err);
          return msg.channel.send('Invalid numbers inserted or no received numbers. I\'m Cancelling your Search.');
        } */
       // var response = 1;
      //	const videoIndex = parseInt(response.first().content);
        var video = await youtube.getVideoByID(videos[0].id);
      } catch (err) {
        console.error(err);
        return msg.channel.send('Yo! I could not find any results!');
      }
    }
    return handleVideo(video, msg, voiceChannel)
  }
  }
} else if (command === 'skip') {
  if (!msg.member.voiceChannel) return msg.channel.send(':red_circle: **Not in a voice channel, I am talking to you**');
  if (!serverQueue) return msg.channel.send(':mailbox_with_no_mail: **I can\'t skip an empty queue**');
  serverQueue.connection.dispatcher.end('Skip command has been used!');
  return undefined;
} else if (command === 'stop') {
  if (!msg.member.voiceChannel) return msg.channel.send(':red_circle: **Not in a voice channel, I am talking to you**');
  if (!serverQueue) return msg.channel.send(':mailbox_with_no_mail: **Nothing to stop, because there is no music!**');
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end('Stop command has been used!');
  msg.channel.send({embed: new Discord.RichEmbed()
                    .setAuthor(msg.author.tag,msg.author.avatarURL)
                    .setDescription(`The player has been stopped.`)
                    .setColor(eColor)
                   })
  return undefined;
} else if (command === 'volume') {
		if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
		if (!serverQueue) return msg.channel.send('There is nothing playing.');
		if (!args[1]) return msg.channel.send(`The current volume is: **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
		return msg.channel.send(`I set the volume to: **${args[1]}**`);
  
} else if (command === 'np' || command === 'nowplaying') {
  if (!serverQueue) return msg.channel.send(':mailbox_with_no_mail: **Wait, There is no music playing!**');
  return msg.channel.send({embed: new Discord.RichEmbed()
                           .setAuthor(msg.author.tag,msg.author.avatarURL)
                           .setDescription(`:notes: **Currently Playing:**\n${serverQueue.songs[0].title}`)
                           .setColor(eColor)
                           .setThumbnail(`https://img.youtube.com/vi/${serverQueue.songs[0].id}/mqdefault.jpg`)
                            
                           .setTimestamp(new Date())
                          })
  //msg.channel.send(`Yo yo! I'm playing :notes: ,**${serverQueue.songs[0].title}**, :notes: currently!`);
} else if (command === 'queue' || command === `q`) {
  if (!serverQueue) return msg.channel.send(':mailbox_with_no_mail: **What? Nothing is playing at all?**');
 return msg.channel.send({embed: new Discord.RichEmbed()
                           .setAuthor(msg.author.tag,msg.author.avatarURL)
                           .setDescription(`:notes: **Song Current Queue:**\n${serverQueue.songs.map(song => `**»** ${song.title}`).join('\n')}`)
                           .setColor(eColor)
                            
                           .setTimestamp(new Date())
                         })
 
 msg.channel.send(`
__**Song queue:**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}

**Now playing:**
:notes: ${serverQueue.songs[0].title} :notes:
  `);




} else if (command === 'pause') {
  if (serverQueue && serverQueue.playing) {
    serverQueue.playing = false;
    serverQueue.connection.dispatcher.pause();
    return msg.channel.send(':pause_button: **The player has been Paused**');
  }
  return msg.channel.send(':mailbox_with_no_mail: **This DJ don\`t know how to pause empty song!**');
} else if (command === 'resume') {
  if (serverQueue && !serverQueue.playing) {
    serverQueue.playing = true;
    serverQueue.connection.dispatcher.resume();
    return msg.channel.send(':play_pause: **The player has been resumed**');
  }
  return msg.channel.send(':mailbox_with_no_mail: **This DJ don\'t know how to resume an empty list!**');
  
} 
  
return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
let eColor = msg.guild.me.displayHexColor!=='#000000' ? msg.guild.me.displayHexColor : 0xffffff
const serverQueue = queue.get(msg.guild.id);
console.log(video);
const song = {
  id: video.id,
  title: Discord.escapeMarkdown(video.title),
  url: `https://www.youtube.com/watch?v=${video.id}`
};
if (!serverQueue) {
  const queueConstruct = {
    textChannel: msg.channel,
    voiceChannel: voiceChannel,
    connection: null,
    songs: [],
    volume: 5,
    playing: true
  };
  queue.set(msg.guild.id, queueConstruct);

  queueConstruct.songs.push(song)
  msg.channel.send({embed: new Discord.RichEmbed()
                                                                        .setAuthor(msg.author.tag,msg.author.avatarURL)
                                                                        .setDescription(`:notes: **Now Playing:**\n${video.title}`)
                                                                        .setTimestamp(new Date())
                                                                         
                    .setThumbnail(`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`)
                                                                        .setColor(eColor)
                                                                       });

  try {
    var connection = await voiceChannel.join();
    queueConstruct.connection = connection;
    play(msg.guild, queueConstruct.songs[0]);
  } catch (error) {
    console.error(`I could not join the voice channel: ${error}`);
    queue.delete(msg.guild.id);
    return msg.channel.send(`I could not join the voice channel: ${error}`);
  }
} else {
  serverQueue.songs.push(song);
  console.log(serverQueue.songs);
  if (playlist) return undefined;
  else return msg.channel.send({embed: new Discord.RichEmbed()
                                                                        .setAuthor(msg.author.tag,msg.author.avatarURL)
                                                                        .setDescription(`:notes: **Added Song:**\n${video.title}`)
                                                                        .setTimestamp(new Date())
                                .setThumbnail(`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`)
                                                                         
                                                                        .setColor(eColor)
                                                                       })
}
return undefined;
}

function play(guild, song) {
const serverQueue = queue.get(guild.id);

if (!song) {
  serverQueue.voiceChannel.leave();
  queue.delete(guild.id);
  return;
}
console.log(serverQueue.songs);

const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
      .on('end', reason => {
          if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
          else console.log(reason);
          serverQueue.songs.shift();
          setTimeout(() => {
              play(guild, serverQueue.songs[0]);
          }, 250);
      })
      .on('error', error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);﻿
}

client.login(process.env.TOKEN)
