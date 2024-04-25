

import { Telegraf } from 'telegraf';
import OpenAI from 'openai';
import userModel from './src/models/User.js';
import connectDb from './src/config/db.js';
import { message } from 'telegraf/filters';
import eventModel from './src/models/Event.js';

const bot = new Telegraf(process.env.BOT_TOKEN);

const openai = new OpenAI({
    apiKey: process.env['OPENAI_KEY'], // This is the default and can be omitted
});

try {
    connectDb();
    console.log('Database connection established');
} catch (err) {
    console.log(err);
    process.kill(process.pid, 'SIGTERM');
}

bot.start(async (ctx) => {
    console.log('ctx', ctx);

    const from = ctx.message.from;
    console.log(from);
    try {
        await userModel.findOneAndUpdate(
            {
                tgId: from.id
            },
            {
                $setOnInsert: {
                    firstName: from.first_name,
                    lastName: from.last_name,
                    isBot: from.is_bot,
                    username: from.username,
                },
            },
            {
                upsert: true,
                new: true,
            }
        );
        await ctx.reply(`Hey, ${from.first_name}! Keep texting me the things you did throughout the day, and I will generate copyright texts for you.`);
        console.log(from);
    } catch (error) {
        console.log(error);
        await ctx.reply(`Facing difficulty, this is the problem: ${error}`);
    }
});

bot.command('generate', async (ctx) => {
    const from = ctx.message.from;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const events = await eventModel.find({
            tgId: from.id,
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay,
            }
        });

        if (events.length === 0) {
            await ctx.reply('No events for the day.');
            return;
        }
        console.log('Events:', events);
        // Call OpenAI API, store token count, and send responses
        try {
            const chatCompletion = await openai.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'act as a senior copyrighter and a big brother to me who write engaging content om the events supplied to you adn g always give a unique fact with  it'

                        ,
                    }, {
                        role: 'user',
                        content: `write like a human and create three engaging posts which are specifically tailored for linkedin , instagram and facebook , focus on engaging respective platfrom audience:
                ${events.map((event) => event.text).join(', ')}`,
                    }

                ],
                model: process.env.OPENAI_MODEL,
            })
            console.log('completion', chatCompletion)
            await ctx.reply('Generating...');

        } catch (error) {
            console.log('facing difficulties', error)
        }



    } catch (error) {
        console.log(error);
        await ctx.reply('Facing difficulties, please try again later.');
    }
});

bot.on('text', async (ctx) => {
    const from = ctx.message.from;
    const messageText = ctx.message.text;

    try {
        await eventModel.create({
            text: messageText,
            tgId: from.id,
        });
        await ctx.reply('Got the message! Keep texting your thoughts to me, and I will generate copyrights for you whenever you need. Just enter the command: /generate');
    } catch (error) {
        console.log(error);
        await ctx.reply('Facing difficulties, please try again later.');
    }
});

bot.launch();





process.once('SIGINT', () => {
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
});
