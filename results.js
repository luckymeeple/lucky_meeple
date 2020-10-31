const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb://localhost:27017/luckymeeple";

const totalTicketsQuery = [
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
      'ticket': '$purchases.tickets'
    }
  }
];


const gamesInLotto = [
    {
        "name": "Pulsar 2849",
        "link": "",
    },
    {
        "name": "Detective",
        "link": "",
    },
    {
        "name": "Concordia",
        "link": "",
    },
    {
        "name": "Imhotep",
        "link": "",
    },
    {
        "name": "Brass Birmingham",
        "link": "",
    },
    {
        "name": "Tikal",
        "link": "",
    },
    {
        "name": "RA",
        "link": "",
    },
    {
        "name": "Through the Ages",
        "link": "",
    },
    {
        "name": "Ghost Stories",
        "link": "",
    },
    {
        "name": "Viticulture",
        "link": "",
    },
    {
        "name": "Tang Garden",
        "link": "",
    },
    {
        "name": "The Grimm Forest",
        "link": "",
    },
    {
        "name": "Space Base",
        "link": "",
    },
    {
        "name": "Village",
        "link": "",
    },
    {
        "name": "Architects of the West Kingdom",
        "link": "",
    },
    {
        "name": "Rajas of the Ganges",
        "link": "",
    },
    {
        "name": "Lockup: A Role Player Tale",
        "link": "",
    },
    {
        "name": "Firenze",
        "link": "",
    },
    {
        "name": "CO2: Second Chance",
        "link": "",
    },
    {
        "name": "Tiny Towns",
        "link": "",
    },
    {
        "name": "Fantastic Factories",
        "link": "",
    },
    {
        "name": "The Networks",
        "link": "",
    },
    {
        "name": "Chimera Station",
        "link": "",
    },
    {
        "name": "Dual Powers: Revolution 1917",
        "link": "",
    },
    {
        "name": "Railroad Revolution",
        "link": "",
    },
    {
        "name": "Trismegistus the Ultimate Formula",
        "link": "",
    },
    {
        "name": "Succullent",
        "link": "",
    },
    {
        "name": "Godspeed",
        "link": "",
    },

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
};

const getTotalTickets = async () => {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true });

        if (!client) {
            return false;
        }

        let result = await client.db("luckymeeple").collection("raffles").aggregate(totalTicketsQuery).toArray();

        client.close();

        if(result) {
            return result.map(r => r.ticket);
        }

        return false;
    }
    catch(e) {
        console.log(e);
        return;
    }
};

const drawResults = async numberOfGames => {
    try {
        let totalTickets = await getTotalTickets();
        let games = shuffle(gamesInLotto);

        if(totalTickets) {
            let table = [];
            for(let i=0;i<=numberOfGames-1;++i) {
                if (!totalTickets.length) {
                    break;
                }

                totalTickets = shuffle(totalTickets);
                let idx = getRandomPosition(totalTickets.length-1);

                ticket = totalTickets.splice(idx, 1);
                table.push([games[i].name, ticket[0]]);
            }
            console.table(table);
        }
    }
    catch(e) {
        console.log(e);
        return false;
    }

    return true;
};

drawResults(gamesInLotto.length);

