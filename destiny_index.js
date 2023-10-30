import 'dotenv/config';
import { Markup, Telegraf } from 'telegraf';
import dialog from './answers.js';
import constants from './constants.js';

let messageData;
let openName;
let internalName;
let userId;
let isUserBot;
const lastAgreeMessageId = 2;
const lastRefuseMessageId = 4;
const lastIgnoreMessageId = 0;
const lastStartButtonMessageId = 6;

const bot = new Telegraf(process.env.TICKET);

bot.use(Telegraf.log());

bot.on("message", onMessage.bind(this));

bot.action("agree", (ctx) => {
    onAction(ctx, lastAgreeMessageId);
});

bot.action("refuse", (ctx) => {
    onAction(ctx, lastRefuseMessageId);
});

bot.action("ignore", (ctx) => {
    onAction(ctx, lastIgnoreMessageId);
});

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
            case constants.IGNORE_TOPIC:
                await ctx.telegram.sendMessage(
                    process.env.postBox,
                    MESSAGE_PATTERN,
                    {
                        message_thread_id: lastIgnoreMessageId
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
        [Markup.button.callback(dialog.agree, "agree")],
        [Markup.button.callback(dialog.refuse, "refuse")],
        [Markup.button.callback(dialog.ignore, "ignore")],
    ]));
}

async function onAction(ctx, parameter) {
    const MESSAGE_PATTERN = await defineUserData(ctx);
    await ctx.telegram.sendMessage(
        process.env.postBox,
        MESSAGE_PATTERN,
        {
            message_thread_id: parameter,
        }
    );

    ctx.reply(dialog.response);
}

async function defineUserData(ctx) {
    messageData = await getUserName(ctx);
    openName = messageData.openName;
    internalName = messageData.internalId;
    userId = (ctx?.update?.message?.from.id || ctx?.update?.callback_query?.from?.id);
    isUserBot = ctx?.update?.message?.from?.is_bot?.toString() || ctx?.update?.callback_query?.from?.is_bot?.toString();

    return "public name: { " + openName + " }\n" + "internal name: { " + internalName + " }\n" + "user id: { " + userId + " }" + "\n" + "is user bot { " + isUserBot + " }" + "\n" + " USER MESSAGE: \n ";
}

async function getUserName(ctx) {
    let username = ctx?.update?.message?.from?.username ||
        ctx?.message?.from?.username ||
        ctx?.message?.chat?.username ||
        ctx?.update?.message?.chat?.username ||
        ctx?.update?.message?.sender_chat?.username ||
        ctx?.update?.callback_query?.from?.username ||
        ctx.username ||
        "закритий акаунт";

    let user_account_data = (ctx) => {
        let firstName = ctx?.update?.message?.from?.first_name ||
            ctx?.update?.callback_query?.from?.first_name ||
            ctx?.message?.from?.first_name ||
            ctx?.message?.chat?.first_name ||
            ctx?.update?.message?.chat?.first_name ||
            ctx?.update?.message?.sender_chat?.first_name ||
            ctx?.first_name

        let lastName = ctx?.update?.message?.from?.last_name ||
            ctx?.update?.callback_query?.from?.last_name ||
            ctx?.message?.from?.last_name ||
            ctx?.message?.chat?.last_name ||
            ctx?.update?.message?.chat?.last_name ||
            ctx?.update?.message?.sender_chat?.last_name ||
            ctx?.last_name

        return firstName + " " + lastName;
    };


    return { openName: "ім'я користувача: " + username, internalId: "внутрішні ідентифікатори: " + user_account_data(ctx) };
}

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
