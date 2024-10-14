let functions = require('../../../functions')
const Discord = require("discord.js");
let db = require('../../../Firebase/models');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cobrar')
        .setDescription('Cria uma cobrança para um usuario!')
        .addStringOption(option =>
            option.setName('descricao')
                .setDescription("Adicione uma descrição para que o usuario saiba sobre oque se refere a cobrança!")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('preco')
                .setDescription("Adicione o preço em centavos sem pontos!")
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription("Adicione o usuario que recebera a cobrança!")
                .setRequired(true)
        ),
    async execute(interaction, client) {
        try {
            let serverID = await interaction.guildId
            let serverData = await db.findOne({ colecao: `servers`, doc: serverID })
            let userSend = await interaction.options.getUser(`usuario`)
            let valor = await interaction.options.getInteger(`preco`)
            let paymentFields = []
            if (serverData.botActive == false) {
                await interaction.reply({
                    content: `⚠️| O vendedor desativou o bot desse servidor!`,
                    ephemeral: true
                })
                return
            }
            if (serverData.bankData && serverData.bankData.mercadoPagoToken && serverData.bankData.mercadoPagoToken != '') {
                paymentFields.unshift(
                    await new Discord.StringSelectMenuOptionBuilder()
                        .setLabel('PIX')
                        .setDescription('Método mais comum de pagamento no Brasil!')
                        .setValue('PIX')
                )
            }
            if (serverData.bankData && serverData.bankData.bankID) {
                paymentFields.push(
                    await new Discord.StringSelectMenuOptionBuilder()
                        .setLabel('Cartão')
                        .setDescription('Pagamento usado mundialmente!')
                        .setValue('card'),
                    await new Discord.StringSelectMenuOptionBuilder()
                        .setLabel('Boleto')
                        .setDescription('Devido ao tempo de processamento, pode demorar até 3 dias para ser aprovado!')
                        .setValue('boleto')
                )
            }
            userSend.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(`Você recebeu uma cobrança no valor de ${functions.formatarMoeda(valor)} do usuario ${interaction.user.username}!`)
                        .setDescription(await interaction.options.getString(`descricao`))
                        .setAuthor({ name: "SDKApps", iconURL: `https://res.cloudinary.com/dgcnfudya/image/upload/v1711769157/vyzyvzxajoboweorxh9s.png` })
                        .addFields(
                            { name: '\u200B', value: '\u200B' },
                            { name: 'Valor da cobrança', value: functions.formatarMoeda(valor) },
                            { name: 'GlobalName do cobrador', value: interaction.user.globalName },
                            { name: 'ID do cobrador', value: interaction.user.id },
                            { name: 'Server ref', value: serverID },
                        )
                        .setTimestamp()
                        .setColor('personalize' in serverData && 'colorDest' in serverData.personalize ? serverData.personalize.colorDest : '#6E58C7')
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`paymentCobranca_${serverID}_${interaction.user.id}_${valor}`)
                                .setLabel('Pagar')
                                .setEmoji(await require('../../emojisGet').comprar)
                                .setStyle('3'),
                        )
                        .addComponents(

                            new Discord.ButtonBuilder()
                                .setCustomId(`cobrancaRecuse_${interaction.user.id}`)
                                .setLabel('Cancelar')
                                .setEmoji(await require('../../emojisGet').cancelar)
                                .setStyle('4')
                        )
                ],
            })
            interaction.reply({ content: `Cobranca enviada!`, ephemeral: true })
        } catch (error) {
            console.log(error);

            interaction.reply({ content: `Erro ao enviar a cobranca!`, ephemeral: true })
        }
    },
};