import 'dotenv/config';
import { Telegraf } from 'telegraf';
import answers, { default as dialog } from './answers.js';
import constants from './constants.js';

let messageData;
let openName;
let internalName;
let userId;
let isUserBot;
const answersToChatIds = [
    2,// agreeChat
    4,// refuseChat
    99,// ignoreChat 
    6 //startButtonPressed
]
const lastAgreeMessageId = 2;
const lastRefuseMessageId = 4;
const lastIgnoreMessageId = 99;
const lastStartButtonMessageId = 6;

const bot = new Telegraf(process.env.TICKET);

bot.use(Telegraf.log());

bot.on("message", onMessage.bind(this));

bot.on('poll_answer', onPollAnswer);

async function onMessage(ctx) {
    let message = ctx?.message?.contact || ctx?.message?.text || ctx?.update?.message?.text || ctx?.message?.reply_to_message?.forum_topic_created?.name;

    let MESSAGE_PATTERN = await defineUserData(ctx);

    if (message) {
        switch (message) {
            case "/start":
                await ctx.telegram.sendMessage(process.env.postBox, MESSAGE_PATTERN + constants.START_WAS_PRESSED);
                break
            default:
                break
        }
    }

    await setPoll(ctx);
}

async function setPoll(ctx) {
    await ctx.replyWithQuiz(dialog.askForChoice,
        [answers.agree, answers.refuse, answers.ignore],
        { correct_option_id: 0, is_anonymous: false }
    )
}

async function onPollAnswer(ctx) {
    const MESSAGE_PATTERN = await defineUserData(ctx);
    await ctx.telegram.sendMessage(
        process.env.postBox,
        MESSAGE_PATTERN,
        {
            message_thread_id: answersToChatIds[ctx.update.poll_answer.option_ids[0]],
        }
    );
    await ctx.telegram.sendMessage(ctx.update.poll_answer.user.id, dialog.response);
}

async function defineUserData(ctx) {
    messageData = await getUserName(ctx);
    openName = messageData.openName;
    internalName = messageData.internalId;
    userId = (ctx?.update?.message?.from.id || ctx?.update?.callback_query?.from?.id || ctx.update.poll_answer.user.id);
    isUserBot = (ctx?.update?.message?.from?.is_bot?.toString() || ctx?.update?.callback_query?.from?.is_bot?.toString() || ctx.update.poll_answer.user.is_bot?.toString());

    return "public name:  " + openName + " \n" + "internal name:  " + internalName + " \n" + "user id:  " + userId + " " + "\n" + "is user bot  " + isUserBot + " " + "\n" + "\n ";
}

async function getUserName(ctx) {
    let username = ctx?.update?.message?.from?.username ||
        ctx?.message?.from?.username ||
        ctx?.message?.chat?.username ||
        ctx?.update?.message?.chat?.username ||
        ctx?.update?.message?.sender_chat?.username ||
        ctx?.update?.callback_query?.from?.username ||
        ctx.username ||
        ctx.update.poll_answer.user.username ||

        "закритий акаунт";

    let user_account_data = (ctx) => {
        let firstName = ctx?.update?.message?.from?.first_name ||
            ctx?.update?.callback_query?.from?.first_name ||
            ctx?.message?.from?.first_name ||
            ctx?.message?.chat?.first_name ||
            ctx?.update?.message?.chat?.first_name ||
            ctx?.update?.message?.sender_chat?.first_name ||
            ctx?.first_name ||
            ctx.update.poll_answer.user.first_name;

        let lastName = ctx?.update?.message?.from?.last_name ||
            ctx?.update?.callback_query?.from?.last_name ||
            ctx?.message?.from?.last_name ||
            ctx?.message?.chat?.last_name ||
            ctx?.update?.message?.chat?.last_name ||
            ctx?.update?.message?.sender_chat?.last_name ||
            ctx?.last_name ||
            ctx.update.poll_answer.user.last_name

        return firstName + " " + lastName;
    };


    return { openName: "ім'я користувача: " + username, internalId: "внутрішні ідентифікатори: " + user_account_data(ctx) };
}

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
