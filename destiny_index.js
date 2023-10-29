import 'dotenv/config';
import { Markup, Telegraf } from 'telegraf';
import dialog from './answers.js';
import constants from './constants.js';

let user;
let userId
let isUserBot;
let lastAgreeMessageId = 2;
let lastRefuseMessageId = 4;
let lastStartButtonMessageId = 6;

const bot = new Telegraf(process.env.TICKET);

bot.use(Telegraf.log());

bot.on("message", onMessage);
bot.action("agree", (ctx) => { onAction(ctx, true) });
bot.action("refuse", (ctx) => { onAction(ctx, false) });

async function onMessage(ctx) {
    // if (JSON.stringify(ctx?.update?.message?.from.id) === process.env.respKey) {

    //     let user = ctx.message.text.match(/\[(.*?)\]/)[1];
    //     let data = ctx.message.text.replace(/\[(.*?)\]/, "");

    //     data && user &&
    //         await bot.telegram.sendMessage(user, data);
    //     console.log("message to user is been sent");

    //     return
    // }

    let message = ctx?.message?.contact || ctx?.message?.text || ctx?.update?.message?.text || ctx?.message?.reply_to_message?.forum_topic_created?.name;
    let topicMessageName = ctx?.message?.reply_to_message?.forum_topic_created?.name;

    let MESSAGE_PATTERN = await defineUserData(ctx);

    if (!message) {
        console.log(ctx);
        return
    }

    if (message) {
        switch (message) {
            case "/start":
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + constants.START_WAS_PRESSED);
                break
            default:
                break
        }

        await setButtons(ctx);
    }

    if (topicMessageName) {
        switch (topicMessageName) {
            case constants.START_TOPIC:
                await ctx.telegram.sendMessage(
                    process.env.postBox,
                    MESSAGE_PATTERN,
                    {
                        message_thread_id: lastStartButtonMessageId
                    }
                );
                break
            case constants.AGREE_TOPIC:
                await ctx.telegram.sendMessage(
                    process.env.postBox,
                    MESSAGE_PATTERN,
                    {
                        message_thread_id: lastAgreeMessageId
                    }
                );
                break
            case constants.REFUSE_TOPIC:
                await ctx.telegram.sendMessage(
                    process.env.postBox,
                    MESSAGE_PATTERN,
                    {
                        message_thread_id: lastRefuseMessageId
                    }
                );
                break
            default:
                break
        }
    }

    !message && await setButtons(ctx);
}

async function setButtons(ctx) {
    await ctx.reply(dialog.askForChoice, Markup.inlineKeyboard([
        [
            Markup.button.callback(dialog.agree, "agree"),
            Markup.button.callback(dialog.refuse, "refuse")
        ]
    ]));
}

// async function setButtonShareContact(ctx) {
//     if (!USER_HAD_SHARE_CONTACT) {
//         const keyboard = Markup.keyboard([
//             Markup.button.contactRequest(dialog.shareContact),
//         ]).resize();
//         return await ctx.replyWithHTML(dialog.callbackContact, keyboard);
//     }

//     return
// };

async function onAction(ctx, parameter) {
    const MESSAGE_PATTERN = await defineUserData(ctx);
    await ctx.telegram.sendMessage(
        process.env.postBox,
        MESSAGE_PATTERN,
        {
            message_thread_id: parameter ? lastAgreeMessageId : lastRefuseMessageId
        }
    );
}

async function defineUserData(ctx) {
    user = await getUserName(ctx);
    userId = JSON.stringify(ctx?.update?.message?.from.id);
    isUserBot = JSON.stringify(ctx?.update?.message?.from.is_bot);

    return "user: { " + user + " }\n" + "user id: { " + userId + " }" + "\n" + "is user bot { " + isUserBot + " }" + "\n" + " USER MESSAGE: \n ";
}

async function getUserName(ctx) {
    let user = JSON.stringify(ctx?.update?.message?.from?.username) ||
        JSON.stringify(ctx?.message?.from?.username) ||
        JSON.stringify(ctx?.message?.chat?.username) ||
        JSON.stringify(ctx?.update?.message?.chat?.username) ||
        JSON.stringify(ctx?.update?.message?.sender_chat?.username) ||
        JSON.stringify(ctx.username);
    if (!user) {
        user = JSON.stringify(ctx?.update?.message?.from?.first_name) + " " + JSON.stringify(ctx?.update?.message?.from?.last_name) ||
            JSON.stringify(ctx?.message?.from?.first_name) + " " + JSON.stringify(ctx?.message?.from?.last_name) ||
            JSON.stringify(ctx?.message?.chat?.first_name) + " " + JSON.stringify(ctx?.message?.chat?.last_name) ||
            JSON.stringify(ctx?.update?.message?.chat?.first_name) + " " + JSON.stringify(ctx?.update?.message?.chat?.last_name) ||
            JSON.stringify(ctx?.update?.message?.sender_chat?.first_name) + " " + JSON.stringify(ctx?.update?.message?.sender_chat?.last_name) ||
            JSON.stringify(ctx.first_name) + " " + JSON.stringify(ctx.last_name);
    }

    return user;
}

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
