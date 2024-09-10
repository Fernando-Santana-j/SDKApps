let functions = require('../../../functions')
const Discord = require("discord.js");
let db = require('../../../Firebase/models');
module.exports = {
    name: 'cobrar',
    description: 'Cria uma cobrança para um usuario!',
    type: 1,
    options: [
        {
            name: 'preco',
            description: "Adicione o preço em centavos sem pontos!",
            type: Discord.ApplicationCommandOptionType.Number,
            required: true
        },
        {
            name: 'descricao',
            description: "Adicione uma descrição para que o usuario saiba sobre oque se refere a cobrança!",
            type: Discord.ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'usuario',
            description: "Adicione o usuario que recebera a cobrança!",
            type: Discord.ApplicationCommandOptionType.User,
            required: true
        },
    ],
    run: async (client, interaction) => {
        let serverID = await interaction.guildId
        let serverData = await db.findOne({colecao:`servers`,doc:serverID})
        let userSend = await interaction.options.getUser(`usuario`)
        let valor = await interaction.options.getNumber(`preco`)
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
        const row = new Discord.ActionRowBuilder().addComponents(
            new Discord.StringSelectMenuBuilder()
                .setCustomId(`paymentMCobranca`)
                .setPlaceholder('Selecione o método de pagamento desejado!')
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions(...paymentFields)
        )
        const row2 = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`cobrancaPayment_${serverID}_${interaction.user.id}_${valor}`)
                    .setLabel('Confirmar')
                    .setStyle('3'),
            )
            .addComponents(

                new Discord.ButtonBuilder()
                    .setCustomId(`cobrancaRecuse_${interaction.user.id}`)
                    .setLabel('Cancelar')
                    .setStyle('4')
            )
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
            components: [row, row2],
        })
        interaction.reply({content:`Cobranca enviada!`,ephemeral:true})
    }
}
