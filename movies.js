/*
  =========================================================
  BW'S MOVIE COLLECTION

  THIS IS THE FILE YOU WILL EDIT TO ADD MOVIES.

  To add another movie later, copy one movie entry,
  change the information, and paste it into the list.

  Physical examples:
    DVD
    Blu-ray
    4K UHD
    VHS

  Digital examples:
    Fandango at Home
    Apple TV
    Amazon Prime Video
    etc.

  Leave a field as an empty string "" if you don't
  have that information yet.
  =========================================================
*/

const movies = [

  {
    title: "Die Another Day",
    year: 2002,
    runtime: "2h 13m",
    genre: "Action / Spy",
    director: "Lee Tamahori",
    cast: "Pierce Brosnan, Halle Berry, Rosamund Pike",
    synopsis: "James Bond is captured and imprisoned by the North Koreans, then returns to action after being released in a prisoner exchange.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Casino Royale",
    year: 2006,
    runtime: "2h 24m",
    genre: "Action / Spy",
    director: "Martin Campbell",
    cast: "Daniel Craig, Eva Green, Judi Dench",
    synopsis: "James Bond earns his license to kill and faces a dangerous poker game against a terrorist financier.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Quantum of Solace",
    year: 2008,
    runtime: "1h 46m",
    genre: "Action / Spy",
    director: "Marc Forster",
    cast: "Daniel Craig, Olga Kurylenko, Mathieu Amalric",
    synopsis: "James Bond pursues an organization involved in a plot to control a valuable natural resource.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Skyfall",
    year: 2012,
    runtime: "2h 23m",
    genre: "Action / Spy",
    director: "Sam Mendes",
    cast: "Daniel Craig, Judi Dench, Javier Bardem",
    synopsis: "Bond's loyalty to M is tested when her past comes back to threaten MI6.",
    physical: ["Blu-ray"],
    digital: []
  },

  {
    title: "8 Mile",
    year: 2002,
    runtime: "1h 50m",
    genre: "Drama / Music",
    director: "Curtis Hanson",
    cast: "Eminem, Kim Basinger, Brittany Murphy",
    synopsis: "An aspiring rapper struggles to find his voice and prove himself in Detroit's underground hip-hop scene.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "10 Things I Hate About You",
    year: 1999,
    runtime: "1h 37m",
    genre: "Comedy / Romance",
    director: "Gil Junger",
    cast: "Heath Ledger, Julia Stiles, Joseph Gordon-Levitt",
    synopsis: "A high-school romance develops around a complicated plan to win over two very different sisters.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "21",
    year: 2008,
    runtime: "2h 3m",
    genre: "Crime / Drama",
    director: "Robert Luketic",
    cast: "Jim Sturgess, Kevin Spacey, Kate Bosworth",
    synopsis: "A brilliant student joins a group that uses card-counting skills to win big in Las Vegas.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "25th Hour",
    year: 2002,
    runtime: "2h 15m",
    genre: "Crime / Drama",
    director: "Spike Lee",
    cast: "Edward Norton, Philip Seymour Hoffman, Barry Pepper",
    synopsis: "A convicted drug dealer spends his final day of freedom reflecting on his life and the choices that brought him there.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "The 40-Year-Old Virgin",
    year: 2005,
    runtime: "1h 56m",
    genre: "Comedy",
    director: "Judd Apatow",
    cast: "Steve Carell, Catherine Keener, Paul Rudd",
    synopsis: "A group of friends attempts to help a middle-aged electronics store employee navigate dating and relationships.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "50 First Dates",
    year: 2004,
    runtime: "1h 39m",
    genre: "Comedy / Romance",
    director: "Peter Segal",
    cast: "Adam Sandler, Drew Barrymore, Rob Schneider",
    synopsis: "A man falls for a woman who has no short-term memory and must win her over again every day.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Ace Ventura: Pet Detective",
    year: 1994,
    runtime: "1h 26m",
    genre: "Comedy",
    director: "Tom Shadyac",
    cast: "Jim Carrey, Courteney Cox, Sean Young",
    synopsis: "A bizarre private detective specializing in missing animals is hired to find a stolen dolphin.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Across the Universe",
    year: 2007,
    runtime: "2h 13m",
    genre: "Musical / Romance",
    director: "Julie Taymor",
    cast: "Evan Rachel Wood, Jim Sturgess, Joe Anderson",
    synopsis: "A young couple's story unfolds against the social and political upheaval of the 1960s, featuring songs by the Beatles.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "A Few Good Men",
    year: 1992,
    runtime: "2h 18m",
    genre: "Drama / Thriller",
    director: "Rob Reiner",
    cast: "Tom Cruise, Jack Nicholson, Demi Moore",
    synopsis: "A military lawyer defends two Marines accused of murdering a fellow soldier at Guantanamo Bay.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "A History of Violence",
    year: 2005,
    runtime: "1h 36m",
    genre: "Crime / Thriller",
    director: "David Cronenberg",
    cast: "Viggo Mortensen, Maria Bello, Ed Harris",
    synopsis: "A quiet family man's violent encounter with criminals brings unwanted attention to his mysterious past.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Along Came Polly",
    year: 2004,
    runtime: "1h 30m",
    genre: "Comedy / Romance",
    director: "John Hamburg",
    cast: "Ben Stiller, Jennifer Aniston, Philip Seymour Hoffman",
    synopsis: "A cautious man finds his carefully planned life turned upside down when he reconnects with an adventurous former classmate.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Almost Famous",
    year: 2000,
    runtime: "2h 2m",
    genre: "Comedy / Drama",
    director: "Cameron Crowe",
    cast: "Patrick Fugit, Kate Hudson, Billy Crudup",
    synopsis: "A teenage music fan gets the chance to write for Rolling Stone while touring with a rising rock band.",
    physical: ["Blu-ray"],
    digital: []
  },

  {
    title: "American History X",
    year: 1998,
    runtime: "1h 59m",
    genre: "Drama",
    director: "Tony Kaye",
    cast: "Edward Norton, Edward Furlong, Beverly D'Angelo",
    synopsis: "A former neo-Nazi attempts to prevent his younger brother from following the same destructive path.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "American Wedding",
    year: 2003,
    runtime: "1h 43m",
    genre: "Comedy",
    director: "Jesse Dylan",
    cast: "Jason Biggs, Alyson Hannigan, Seann William Scott",
    synopsis: "Jim and Michelle prepare for their wedding while their friends create one chaotic situation after another.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "The American President",
    year: 1995,
    runtime: "1h 54m",
    genre: "Drama / Romance",
    director: "Rob Reiner",
    cast: "Michael Douglas, Annette Bening, Martin Sheen",
    synopsis: "A widowed U.S. president begins a relationship with an environmental lobbyist while facing political opposition.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Anchorman",
    year: 2004,
    runtime: "1h 34m",
    genre: "Comedy",
    director: "Adam McKay",
    cast: "Will Ferrell, Christina Applegate, Paul Rudd",
    synopsis: "A top-rated 1970s news anchor struggles when a talented female reporter joins his newsroom.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Angels & Demons",
    year: 2009,
    runtime: "2h 18m",
    genre: "Mystery / Thriller",
    director: "Ron Howard",
    cast: "Tom Hanks, Ewan McGregor, Ayelet Zurer",
    synopsis: "Robert Langdon races through Rome to stop a secret society from destroying the Vatican.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Antitrust",
    year: 2001,
    runtime: "1h 48m",
    genre: "Thriller",
    director: "Peter Howitt",
    cast: "Ryan Phillippe, Rachael Leigh Cook, Tim Robbins",
    synopsis: "A talented young programmer takes a dream job at a powerful software company and discovers a disturbing secret.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Any Given Sunday",
    year: 1999,
    runtime: "2h 42m",
    genre: "Sports / Drama",
    director: "Oliver Stone",
    cast: "Al Pacino, Cameron Diaz, Jamie Foxx",
    synopsis: "A veteran football coach struggles with his team's changing fortunes and a new generation of players.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Armageddon",
    year: 1998,
    runtime: "2h 31m",
    genre: "Action / Sci-Fi",
    director: "Michael Bay",
    cast: "Bruce Willis, Ben Affleck, Liv Tyler",
    synopsis: "A group of oil drillers is sent into space to prevent a massive asteroid from destroying Earth.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Assassins",
    year: 1995,
    runtime: "2h 12m",
    genre: "Action / Thriller",
    director: "Richard Donner",
    cast: "Sylvester Stallone, Antonio Banderas, Julianne Moore",
    synopsis: "An aging professional hitman becomes the target of a younger assassin who wants to take his place.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "The A-Team",
    year: 2010,
    runtime: "1h 57m",
    genre: "Action / Adventure",
    director: "Joe Carnahan",
    cast: "Liam Neeson, Bradley Cooper, Sharlto Copley",
    synopsis: "A group of former Special Forces soldiers is framed for a crime and sets out to clear its name.",
    physical: ["Blu-ray"],
    digital: []
  },

  {
    title: "Backdraft",
    year: 1991,
    runtime: "2h 17m",
    genre: "Action / Drama",
    director: "Ron Howard",
    cast: "Kurt Russell, William Baldwin, Robert De Niro",
    synopsis: "Two firefighter brothers investigate a series of suspicious fires while dealing with their own complicated relationship.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Back to the Future Trilogy",
    year: 1985,
    runtime: "5h 42m",
    genre: "Adventure / Comedy",
    director: "Robert Zemeckis",
    cast: "Michael J. Fox, Christopher Lloyd, Lea Thompson",
    synopsis: "Marty McFly and Doc Brown travel through time and repeatedly risk changing the course of history.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Bad Boys II",
    year: 2003,
    runtime: "2h 27m",
    genre: "Action / Comedy",
    director: "Michael Bay",
    cast: "Will Smith, Martin Lawrence, Jordi Mollà",
    synopsis: "Two Miami detectives investigate a dangerous drug dealer while dealing with personal complications.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Bandits",
    year: 2001,
    runtime: "2h 3m",
    genre: "Comedy / Crime",
    director: "Barry Levinson",
    cast: "Bruce Willis, Billy Bob Thornton, Cate Blanchett",
    synopsis: "Two escaped convicts become successful bank robbers and find their partnership complicated by a woman they both love.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Baywatch",
    year: 2017,
    runtime: "1h 56m",
    genre: "Comedy / Action",
    director: "Seth Gordon",
    cast: "Dwayne Johnson, Zac Efron, Alexandra Daddario",
    synopsis: "A group of lifeguards uncovers a criminal conspiracy threatening their beach.",
    physical: ["Blu-ray"],
    digital: []
  },

  {
    title: "Be Cool",
    year: 2005,
    runtime: "1h 58m",
    genre: "Comedy / Crime",
    director: "F. Gary Gray",
    cast: "John Travolta, Uma Thurman, Vince Vaughn",
    synopsis: "A former mob associate tries to make his mark in the music business.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Bedazzled",
    year: 2000,
    runtime: "1h 33m",
    genre: "Comedy / Fantasy",
    director: "Harold Ramis",
    cast: "Brendan Fraser, Elizabeth Hurley, Frances O'Connor",
    synopsis: "A lonely man makes a deal with the Devil in exchange for seven wishes, with unexpected consequences.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Begin Again",
    year: 2013,
    runtime: "1h 44m",
    genre: "Drama / Music",
    director: "John Carney",
    cast: "Keira Knightley, Mark Ruffalo, Adam Levine",
    synopsis: "A disgraced music producer and a talented singer-songwriter form an unlikely partnership to record an album throughout New York City.",
    physical: ["Blu-ray"],
    digital: []
  },

  {
    title: "Big Daddy",
    year: 1999,
    runtime: "1h 33m",
    genre: "Comedy",
    director: "Dennis Dugan",
    cast: "Adam Sandler, Joey Lauren Adams, Cole Sprouse",
    synopsis: "A lazy bachelor takes in a young boy to impress his girlfriend and unexpectedly becomes attached to him.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Billy Madison",
    year: 1995,
    runtime: "1h 29m",
    genre: "Comedy",
    director: "Tamra Davis",
    cast: "Adam Sandler, Bradley Whitford, Bridgette Wilson",
    synopsis: "A spoiled heir goes back to school to prove that he is capable of taking over his father's business.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "The Blind Side",
    year: 2009,
    runtime: "2h 9m",
    genre: "Drama / Sports",
    director: "John Lee Hancock",
    cast: "Sandra Bullock, Quinton Aaron, Tim McGraw",
    synopsis: "A teenager from a troubled background finds support from a family that helps him pursue football and a new future.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "Blood Diamond",
    year: 2006,
    runtime: "2h 23m",
    genre: "Drama / Thriller",
    director: "Edward Zwick",
    cast: "Leonardo DiCaprio, Djimon Hounsou, Jennifer Connelly",
    synopsis: "A fisherman and a diamond smuggler form an uneasy alliance during the civil war in Sierra Leone.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "The Bourne Identity",
    year: 2002,
    runtime: "1h 59m",
    genre: "Action / Thriller",
    director: "Doug Liman",
    cast: "Matt Damon, Franka Potente, Chris Cooper",
    synopsis: "A man suffering from amnesia discovers that he possesses extraordinary skills and is being hunted by assassins.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "The Bourne Legacy",
    year: 2012,
    runtime: "2h 15m",
    genre: "Action / Thriller",
    director: "Tony Gilroy",
    cast: "Jeremy Renner, Rachel Weisz, Edward Norton",
    synopsis: "An operative from a secret government program fights to survive after the program is exposed.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "The Bourne Supremacy",
    year: 2004,
    runtime: "1h 48m",
    genre: "Action / Thriller",
    director: "Paul Greengrass",
    cast: "Matt Damon, Franka Potente, Joan Allen",
    synopsis: "Jason Bourne is pulled back into the world of espionage when he is framed for a CIA operation.",
    physical: ["DVD"],
    digital: []
  },

  {
    title: "The Bourne Ultimatum",
    year: 2007,
    runtime: "1h 55m",
    genre: "Action / Thriller",
    director: "Paul Greengrass",
    cast: "Matt Damon, Julia Stiles, David Strathairn",
    synopsis: "Jason Bourne searches for the truth about his past while evading agents determined to eliminate him.",
    physical: ["DVD"],
    digital: []
  }

];
