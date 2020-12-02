const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb://localhost:27017/luckymeeple";

const inquirer = require('inquirer');
const chalk = require("chalk");
const figlet = require("figlet");
const moment = require('moment');
const readlineSync = require('readline-sync');

const blacklist = [
    'F566E4',
    '305E5E',
    'AF6C33',
    '476166',
    'E2E40E',
    'C3C350',
    '27B0DE',
    '363450',
    '081695',
    'CC05CC',
    '2AAB61',
    'C2D98D',
    '5538CF',
    'DB8EA0',
    'B31339',
    'E28C1A',
    '61824F',
    'D3DA4A',
    'D665B9',
    'C4F3E1',
    '8BCF26',
    '24A99B',
    '7C347E',
    '4B927D',
    '48111B',
    '180624'
];

const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const getRandomPosition = max => {
    return Math.floor(Math.random() * (max + 1));
}

const deleteWinners = async (raffle_id) => {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        if (!client) {
            return false;
        }
       
        await client.db("luckymeeple").collection("raffles").updateOne({"_id": raffle_id}, {$unset: {winners:1}});
       
        client.close();
    }
    catch(e) {
        console.log(e);
    }

};

const getRaffle = async () => {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        if (!client) {
            return false;
        }

        let raffle = await client.db("luckymeeple").collection("raffles").findOne({'current': true});
              
        client.close();

        return raffle;
    }
    catch(e) {
        console.log(e);
        return;
    }

};

const getTotalTicketsPerBuyer= async () => {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const totalTicketsPerBuyerQuery = [
            {
                '$match': {
                    'current': true
                }
            }, {
                '$unwind': {
                    'path': '$purchases'
                }
            }, {
                '$unwind': {
                    'path': '$purchases.tickets'
                }
            }, {
                '$match': {
                    'purchases.state': 'paid'
                }
            }, {
                '$project': {
                    'email': '$purchases.person.email', 
                    'tickets': '$purchases.tickets'
                }
            }, {
                '$group': {
                    '_id': '$email', 
                    'tickets': {
                        '$push': '$tickets'
                    }, 
                    'total': {
                        '$sum': 1
                    }
                }
            }, {
                '$sort': {
                    'total': -1
                }
            }
        ];
                
        if (!client) {
            return false;
        }

        let result = await client.db("luckymeeple").collection("raffles").aggregate(totalTicketsPerBuyerQuery).toArray();

        client.close();

        if(result) {
            let buyers = {};
	        result.forEach(r => {
                buyers[r._id] = r.total;
            });

            return buyers;
        }
        
        return false;
    }
    catch(e) {
        console.log(e);
        return;
    }
};


const getTickets = async () => {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const ticketsWithUserQuery = [
            {
                '$match': {
                    'current': true
                }
            }, {
                '$unwind': {
                    'path': '$purchases'
                }
            }, {
                '$unwind': {
                    'path': '$purchases.tickets'
                }
            }, {
                '$match': {
                    'purchases.state': 'paid'
                }
            }, {
                '$project': {
                    'email': '$purchases.person.email', 
                    'name': '$purchases.person.name', 
                    'phone': '$purchases.person.phone',
                    'bgg': '$purchases.person.bgg',
                    'tickets': '$purchases.tickets'
                }
            }, {
                '$sort': {
                    'tickets': 1
                }
            }, {
                '$group': {
                    '_id': null, 
                    'tickets': {
                        '$push': {
                            'ticket': '$tickets', 
                            'email': '$email',
                            'name': '$name',
                            'phone': '$phone',
                            'bgg': '$bgg'
                        }
                    }
                }
            } 
        ];

        if (!client) {
            return false;
        }

        let ticketsWithUser = await client.db("luckymeeple").collection("raffles").aggregate(ticketsWithUserQuery).toArray();


        client.close();

        if(ticketsWithUser && ticketsWithUser.length) {
            let tickets = ticketsWithUser[0].tickets;

            if(blacklist.length) {
                tickets = tickets.filter(t => blacklist.indexOf(t.ticket) === -1);
            }

            return shuffle(tickets);
        }
        
        return false;
    }
    catch(e) {
        console.log(e);
        return;
    }

};

const getWinner = (tickets)  => {
    return getRandomPosition(tickets.length-1);
};

const addWinner = async(raffle_id, winner) => {

    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    if (!client) {
        return false;
    }

    var item = {
        $push: {
            "winners": winner
        }
    };

    const result = await client.db("luckymeeple").collection("raffles").updateOne({"_id": raffle_id}, item);

    client.close();

    if (!result) {
        return false;
    }

    return result;

};

const showHeader = (raffle, totalTickets) => {

    console.clear();
    console.log(
        chalk.yellow(
            figlet.textSync("Lucky Meeple", {
            font: "Doom",
            horizontalLayout: "default",
            verticalLayout: "default"
            })
        )
    );

    // do we have tickets?
    if (!totalTickets) {
        console.log('-');
        console.log('Cedo demais para o sorteio...não temos rifas ainda :)');
        console.log('-');
        process.exit(1);	
    }

    // do we have tickets?
    if (!raffle.games || !raffle.games.length) {
        console.log('-');
        console.log('Cedo demais para o sorteio...não temos jogos ainda :)');
        console.log('-');
        process.exit(1);
    }

    let started = moment(raffle.starts).format("D/MMM");
    
    console.log('-');
    console.log(`Este sorteio começou a ${chalk.green(started)} e terminou com ${chalk.green(totalTickets + " rifas")} compradas e ${chalk.green(raffle.games.length + " jogos")} desbloqueados.`);
    console.log('-');
    console.log();

};

const init = async() => {
    
    let raffle = await getRaffle();
    let tickets = await getTickets();

    showHeader(raffle, tickets.length);

    // do we have have winners?
    if (raffle.winners && raffle.winners.length) {
        inquirer
        .prompt([
          {
            type: 'list',
            name: 'winners',
            message: 'Parece que já existem vencedores registados neste sorteio. Que queres fazer?',
            choices: ['Eliminar os vencedores e continuar', 'Sair do sorteio'],
          },
        ])
        .then(answers => {

            if (answers.winners == 'Sair do sorteio') {
                console.clear();
                process.exit(1);
            }

            deleteWinners(raffle._id);
            console.log('-');

            readlineSync.question("Vamos dar início ao sorteio! Agora já não há volta atrás...vamos a isto? ");
            drawResults(raffle);
        
        });
      
    }
    else {
        readlineSync.question("Vamos dar início ao sorteio! Agora já não há volta atrás...vamos a isto? ");
        drawResults(raffle);
    }

};

const drawResults = async (raffle) => {
    try {

        let tickets = shuffle(await getTickets());
        let totalTickets = await getTotalTicketsPerBuyer();
        let games = raffle.games;

        if(tickets && tickets.length) {

            let table = [];
            let numTickets = tickets.length;

            for(let i=0;i<=games.length-1;++i) {

                let winner = tickets.splice(getWinner(tickets), 1)[0];

                let winning_ticket = {
                    'ticket': winner.ticket,
                    'total_bought': totalTickets[winner.email],
                    'person': {
                        'name': winner.name,
                        'phone': winner.phone,
                        'email': winner.email,
                        'bgg': winner.bgg
                    },
                    'game': {
                        'name': games[i].name,
                        'link': games[i].link 
                    }
                }

                await addWinner(raffle._id, winning_ticket);
                
                table.push([games[i].name, games[i].link, winner.ticket]);

                showHeader(raffle, numTickets);
                console.table([[games[i].name, games[i].link, winner.ticket]]);

                readlineSync.question("Parabéns ao vencedor! :) Continuamos? ");
            }

            showHeader(raffle, numTickets);
            console.log('Parabéns aos vencedores e obrigado a todos por participarem! Em breve receberão um e-mail com o resultado deste sorteio.');
            console.table(table);

        }
    }
    catch(e) {
        console.log(e);
        return false;
    }

    return true;
};

init();
