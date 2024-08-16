// test/GameToken.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseUnits } = require("@ethersproject/units");
const {
    loadFixture,
    time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function deployGameTokenFixture() {
    const [deployer, address1, address2] = await ethers.getSigners();
    const GameToken = await ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    // await gameToken.waitForDeployment().wait();
    return { gameToken, deployer, address1, address2 };
}

describe("GameToken", async function () {
    describe("Deploymnet", function () {
        it("Should set the right owner", async function () {
            const { gameToken, deployer } = await loadFixture(deployGameTokenFixture);
            // console.log(await gameToken.owner())
            expect(await gameToken.owner()).to.equal(deployer.address);
        })
    })

    describe("MintingAvatar", async function () {

        it("Should mint an avatar correctly", async function () {

            const { gameToken, deployer } = await loadFixture(deployGameTokenFixture);
            const avatarName = "Pegasus";
            const fileName = "pegasus1.png";
            const priceInGwei = 5000;

            // Ensure only deployer can mint
            await expect(
                gameToken.connect(deployer).mintAvatar(avatarName, fileName, priceInGwei)
            ).to.not.be.reverted;
            // const tx = await gameToken.connect(deployer).mintAvatar(avatarName, fileName, priceInGwei)
            // await tx.wait();
            const avatar = await gameToken.getAvatar(0); // Assuming tokenId starts from 0
            expect(avatar.price).to.equal(priceInGwei);
            expect(avatar.name).to.equal(avatarName);
            expect(avatar.fileName).to.equal(fileName);
            expect(avatar.isForSale).to.be.false;
            // Verify token ownership
            expect(await gameToken.ownerOf(0)).to.equal(deployer.address);
            const [ownedAvatars, totalOwned] = await gameToken.connect(deployer).getMyAvatars();
            // Check if avatar count for owner is incremented
            expect(totalOwned).to.equal(1);
            expect(ownedAvatars[0].name).to.equal(avatarName);

        })



    })

    describe("SetPrice", async function () {
        it("Only avatar owner can change price", async function () {
            const { gameToken, deployer } = await loadFixture(deployGameTokenFixture);
            const avatarName = "Pegasus";
            const fileName = "pegasus1.png";
            const priceInGwei = 5000;

            // Ensure only deployer can mint
            await expect(
                gameToken.connect(deployer).mintAvatar(avatarName, fileName, priceInGwei)
            ).to.not.be.reverted;
            await gameToken.connect(deployer).setAvatarPrice(0, 1000);
            const avatar = await gameToken.getAvatar(0); // Assuming tokenId starts from 0
            expect(avatar.price).to.equal(1000);
        })
        it("Non-owners cannot change avatar price", async function () {
            const { gameToken, deployer, address1 } = await loadFixture(deployGameTokenFixture);
            await gameToken.connect(deployer).mintAvatar("Pegasus", "pegasus1.png", 5000);

            await expect(
                gameToken.connect(address1).setAvatarPrice(0, 1000)
            ).to.be.revertedWith("Not the owner of the avatar");
        });
    })

    describe("Sale Listing", function () {
        it("Should list avatar for sale", async function () {
            const { gameToken, deployer } = await loadFixture(deployGameTokenFixture);
            await gameToken.connect(deployer).mintAvatar("Pegasus", "pegasus1.png", 5000);

            await gameToken.connect(deployer).listAvatarForSale(0, 1000);
            const avatar = await gameToken.getAvatar(0);
            expect(avatar.isForSale).to.be.true;
            expect(avatar.price).to.equal(1000);
        });

        it("Should unlist avatar", async function () {
            const { gameToken, deployer, address1 } = await loadFixture(deployGameTokenFixture);
            await gameToken.connect(deployer).mintAvatar("Pegasus", "pegasus1.png", 5000);

            await gameToken.connect(deployer).listAvatarForSale(0, 1000);
            await gameToken.connect(deployer).unlistAvatar(0);
            const avatar = await gameToken.getAvatar(0);
            expect(avatar.isForSale).to.be.false;
        });

        it("Should purchase an avatar", async function () {
            const { gameToken, deployer, address1 } = await loadFixture(deployGameTokenFixture);

            await gameToken.connect(deployer).mintAvatar("Pegasus", "pegasus1.png", 5000);
            await gameToken.connect(deployer).listAvatarForSale(0, 1000);

            await expect(() =>
                gameToken.connect(address1).buyAvatar(0, { value: 1000 })
            ).to.changeEtherBalances([address1, deployer], [-1000, 1000]);

            const avatar = await gameToken.getAvatar(0);
            expect(avatar.isForSale).to.be.false;
            expect(await gameToken.ownerOf(0)).to.equal(address1.address);
        });

        it("Should revert if insufficient ETH is sent for purchase", async function () {
            const { gameToken, deployer, address1 } = await loadFixture(deployGameTokenFixture);

            await gameToken.connect(deployer).mintAvatar("Pegasus", "pegasus1.png", 5000);
            await gameToken.connect(deployer).listAvatarForSale(0, 1000);

            await expect(
                gameToken.connect(address1).buyAvatar(0, { value: 500 })
            ).to.be.revertedWith("Insufficient ETH sent");
        });

        it("Should revert if avatar is not for sale", async function () {
            const { gameToken, deployer, address1 } = await loadFixture(deployGameTokenFixture);

            await gameToken.connect(deployer).mintAvatar("Pegasus", "pegasus1.png", 5000);

            await expect(
                gameToken.connect(address1).buyAvatar(0, { value: 5000 })
            ).to.be.revertedWith("Avatar is not for sale");
        });
    });

    // describe("Event Emit", function () {
    //     it("Should emit AvatarMinted event on minting", async function () {
    //         const { gameToken, deployer, address1 } = await loadFixture(deployGameTokenFixture);
    //         const eventSignatures = [
    //             "AvatarMinted(uint256,string, string, uint256)",
    //             "AvatarPriceUpdated(uint256,uint256)",
    //             "AvatarListedForSale(uint256,uint256)",
    //             "AvatarUnlisted(uint256)",
    //             "AvatarPurchased(uint256,address,uint256)",
    //             "Transfer(address,address,uint256)"
    //         ];
    //         // Create filters for all events
    //         const filters = eventSignatures.map(sig => {
    //             return {
    //                 address: gameToken.address,
    //                 topics: [ethers.utils.id(sig)]
    //             };
    //         });
    //         // Perform actions that trigger events
    //         const mintTx = await gameToken.mintAvatar("Pegasus", "pegasus1.png", 5000);
    //         await mintTx.wait();

    //         const listTx = await gameToken.listAvatarForSale(0, 1000);
    //         await listTx.wait();

    //         const buyTx = await gameToken.connect(addr1).buyAvatar(0, { value: 1000 });
    //         await buyTx.wait();

    //         // Retrieve logs for all events
    //         const logs = [];
    //         for (const filter of filters) {
    //             const logsForEvent = await fetchLogs(filter);
    //             logs.push(...logsForEvent);
    //         }

    //         // Parse logs to decode event data
    //         for (const log of logs) {
    //             const parsedLog = ethers.utils.parseLog({
    //                 topics: log.topics,
    //                 data: log.data,
    //                 abi: [
    //                     "event AvatarMinted(uint256 tokenId, string name, uint256 price)",
    //                     "event AvatarPriceUpdated(uint256 tokenId, uint256 newPrice)",
    //                     "event AvatarListedForSale(uint256 tokenId, uint256 price)",
    //                     "event AvatarUnlisted(uint256 tokenId)",
    //                     "event AvatarPurchased(uint256 tokenId, address newOwner, uint256 price)",
    //                     "event Transfer(address from, address to, uint256 tokenId)"
    //                 ]
    //             });

    //             console.log("Event:", parsedLog.eventName);
    //             console.log("Arguments:", parsedLog.args);
    //         }
    //     });
    // })


});
