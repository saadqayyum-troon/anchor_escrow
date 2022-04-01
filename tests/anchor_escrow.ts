import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { AnchorEscrow } from "../target/types/anchor_escrow";
import * as spl from "@solana/spl-token";

describe("anchor_escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AnchorEscrow as Program<AnchorEscrow>;
  const wallet = program.provider.wallet;
  const payer = wallet;
  let escrowAccount: anchor.web3.PublicKey;

  const payer_signer: anchor.web3.Signer = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      20, 133, 36, 149, 179, 209, 141, 103, 19, 16, 125, 72, 27, 36, 130, 132,
      46, 202, 58, 248, 175, 17, 112, 164, 218, 203, 233, 140, 135, 74, 66, 228,
      245, 56, 14, 199, 136, 61, 253, 82, 30, 96, 144, 3, 108, 21, 206, 218,
      162, 208, 89, 41, 16, 93, 182, 238, 233, 114, 97, 50, 61, 166, 91, 13,
    ])
  );

  it("Testing!", async () => {
    // Initialize escrow.

    // Create a Token
    const mint = await spl.createMint(
      provider.connection,
      payer_signer,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      9
    );

    // Create Token Account
    const tokenAccount = await spl.getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer_signer,
      mint,
      payer.publicKey
    );

    console.log("User Token Account: ", tokenAccount.address.toString());

    // Mint
    await spl.mintTo(
      provider.connection,
      payer_signer,
      mint,
      tokenAccount.address,
      provider.wallet.publicKey,
      100
    );

    (async () => {
      const tokenAccounts = await provider.connection.getTokenAccountsByOwner(
        provider.wallet.publicKey,
        {
          programId: spl.TOKEN_PROGRAM_ID,
        }
      );

      console.log("Token                                         Balance");
      console.log(
        "------------------------------------------------------------"
      );
      tokenAccounts.value.forEach((e) => {
        const accountInfo = spl.AccountLayout.decode(e.account.data);
        console.log(
          `${new anchor.web3.PublicKey(accountInfo.mint)}   ${
            accountInfo.amount
          }`
        );
      });
    })();

    [escrowAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("Kaiju3")],
      program.programId
    );

    console.log("Escrow Account: ", escrowAccount.toString());

    const initTx = await program.rpc.initEscrow({
      accounts: {
        kaijuCoinMint: mint,
        escrowAccount: escrowAccount,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        payer: payer.publicKey,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [],
      // Payer is injected as a signer
    });

    console.log("Init Escrow Tx", initTx);
    let tx;
    try {
      tx = await program.rpc.submit(new anchor.BN(60), {
        accounts: {
          fromAssocTokenAcct: tokenAccount.address,
          escrowAccount: escrowAccount,
          fromAccount: payer_signer.publicKey,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [],
        // Payer/from account injected as a signer
      });

      console.log("Submit tx", tx);
    } catch (error) {
      console.log("Submit tx", tx);
    }

    (async () => {
      const tokenAccounts = await provider.connection.getTokenAccountsByOwner(
        provider.wallet.publicKey,
        {
          programId: spl.TOKEN_PROGRAM_ID,
        }
      );

      console.log("Token                                         Balance");
      console.log(
        "------------------------------------------------------------"
      );
      tokenAccounts.value.forEach((e) => {
        const accountInfo = spl.AccountLayout.decode(e.account.data);
        console.log(
          `${new anchor.web3.PublicKey(accountInfo.mint)}   ${
            accountInfo.amount
          }`
        );
      });
    })();

    (async () => {
      const tokenAccounts = await provider.connection.getTokenAccountsByOwner(
        escrowAccount,
        {
          programId: spl.TOKEN_PROGRAM_ID,
        }
      );

      console.log("Token                                         Balance");
      console.log(
        "------------------------------------------------------------"
      );
      tokenAccounts.value.forEach((e) => {
        const accountInfo = spl.AccountLayout.decode(e.account.data);
        console.log(
          `${new anchor.web3.PublicKey(accountInfo.mint)}   ${
            accountInfo.amount
          }`
        );
      });
    })();
  });
});
