const  bcrypt =require( 'bcrypt');


(async () => {
    const hash = await bcrypt.hash("123456789", 10);
    console.log(hash);
})();