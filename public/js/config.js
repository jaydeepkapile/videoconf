turnConfig = {
    iceServers: [{
        urls: [ "stun:eu-turn4.xirsys.com" ]
     }, {
        username: "r4-XsjyAqW6ScDRUmYH0kPtsy6AfgEcIxdZjPNkpm-u5n-Rq_y-OAc6YMAfFgNCUAAAAAGMeUatqYXlkZWVwa2FwaWxl",
        credential: "e4753358-3217-11ed-8a0d-0242ac140004",
        urls: [
            "turn:eu-turn4.xirsys.com:80?transport=udp",
            "turn:eu-turn4.xirsys.com:3478?transport=udp",
            "turn:eu-turn4.xirsys.com:80?transport=tcp",
            "turn:eu-turn4.xirsys.com:3478?transport=tcp",
            "turns:eu-turn4.xirsys.com:443?transport=tcp",
            "turns:eu-turn4.xirsys.com:5349?transport=tcp"
        ]
     }]}