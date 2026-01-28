/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/onchain_xyber_points.json`.
 */
export type OnchainXyberPoints = {
  "address": "oxp5daG6BinG1AL2W83RQmmN8tcXJqrqy3bYprLMRV8",
  "metadata": {
    "name": "onchainXyberPoints",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  120,
                  121,
                  98,
                  101,
                  114,
                  45,
                  112,
                  111,
                  105,
                  110,
                  116,
                  115,
                  45,
                  48
                ]
              },
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "pointsMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  120,
                  121,
                  98,
                  101,
                  114,
                  45,
                  112,
                  111,
                  105,
                  110,
                  116,
                  115,
                  45,
                  48
                ]
              },
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  105,
                  110,
                  116,
                  115,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "pubkey"
        },
        {
          "name": "newMinter",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "mintPoints",
      "discriminator": [
        103,
        20,
        74,
        182,
        251,
        237,
        202,
        2
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  120,
                  121,
                  98,
                  101,
                  114,
                  45,
                  112,
                  111,
                  105,
                  110,
                  116,
                  115,
                  45,
                  48
                ]
              },
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "nonce",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  120,
                  121,
                  98,
                  101,
                  114,
                  45,
                  112,
                  111,
                  105,
                  110,
                  116,
                  115,
                  45,
                  48
                ]
              },
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "recipient"
              }
            ]
          }
        },
        {
          "name": "pointsMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  120,
                  121,
                  98,
                  101,
                  114,
                  45,
                  112,
                  111,
                  105,
                  110,
                  116,
                  115,
                  45,
                  48
                ]
              },
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  105,
                  110,
                  116,
                  115,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "recipient"
        },
        {
          "name": "recipientAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "recipient"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "pointsMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "nonce",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "nonce",
      "discriminator": [
        143,
        197,
        147,
        95,
        106,
        165,
        50,
        43
      ]
    }
  ],
  "events": [
    {
      "name": "initialized",
      "discriminator": [
        208,
        213,
        115,
        98,
        115,
        82,
        201,
        209
      ]
    },
    {
      "name": "pointsMinted",
      "discriminator": [
        194,
        74,
        48,
        58,
        130,
        225,
        18,
        43
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Unauthorized: signer is not authorized"
    },
    {
      "code": 6001,
      "name": "invalidAdmin",
      "msg": "Invalid admin: cannot set admin to default pubkey"
    },
    {
      "code": 6002,
      "name": "invalidMintAuthority",
      "msg": "Invalid mint authority: mint_authority does not own the mint"
    },
    {
      "code": 6003,
      "name": "invalidDecimals",
      "msg": "Invalid decimals: mint decimals do not match expected"
    },
    {
      "code": 6004,
      "name": "invalidNonce",
      "msg": "Invalid nonce: provided nonce does not match expected"
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "minter",
            "type": "pubkey"
          },
          {
            "name": "pointsMint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "initialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "minter",
            "type": "pubkey"
          },
          {
            "name": "pointsMint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "nonce",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pointsMinted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "nonce",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "configSeed",
      "type": "bytes",
      "value": "[99, 111, 110, 102, 105, 103]"
    },
    {
      "name": "deployer",
      "type": "pubkey",
      "value": "keeppCujRWx7HW8AgCL3F9CfaAM2hRKvWvNVo6iGToE"
    },
    {
      "name": "nonceSeed",
      "type": "bytes",
      "value": "[110, 111, 110, 99, 101]"
    },
    {
      "name": "pointsMintSeed",
      "type": "bytes",
      "value": "[112, 111, 105, 110, 116, 115, 95, 109, 105, 110, 116]"
    },
    {
      "name": "seedRoot",
      "type": "bytes",
      "value": "[120, 121, 98, 101, 114, 45, 112, 111, 105, 110, 116, 115, 45, 48]"
    }
  ]
};
