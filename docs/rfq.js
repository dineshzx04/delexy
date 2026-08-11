const rfq = [
  {
    rfqId: "rfq-01",
    status: "IN_PROGRESS",
    requesterId: "party-01",

    rfqItems: [
      {
        id: "item-01",
        categoryId: "cat-01",
        quantity: 10,
        unit: "kg",

        requestAttributes: [
          {
            id: "item-att-01",
            groupId: "grp-1",
            attributeId: "attr-1",
            attributeName: "Color",

            value: [
              { valueId: "val-1-1", valueLabel: "Dark Gray" },
              { valueId: "val-1-2", valueLabel: "Dark Red" },
            ],

            comments: [
              {
                comment:
                  "I don't want black. I have chosen 2 colors. Please give any other color option.",
                sender: "requester",
                senderId: "party-01",
              },
            ],
          },
        ],

        sellerQuotes: [
          {
            sellerId: "party-02",
            reviewRound: 1,
            status: "SUBMITTED",

            sellerQuoteAttributes: [
              {
                itemAttributeId: "item-att-01",
                groupId: "grp-1",
                attributeId: "attr-1",
                attributeName: "Color",

                offered: [
                  {
                    valueId: "val-1-3",
                    valueLabel: "Off Gray",
                  },
                  {
                    valueId: "val-1-4",
                    valueLabel: "Lite Gray",
                  },
                ],

                comments: [
                  {
                    comment:
                      "We can offer Off Gray and Lite Gray instead.",
                    sender: "responder",
                    senderId: "party-02",
                  },
                ],
              },
            ],
          },

          {
            sellerId: "party-02",
            reviewRound: 2,
            status: "SUBMITTED",

            sellerQuoteAttributes: [
              {
                itemAttributeId: "item-att-01",
                groupId: "grp-1",
                attributeId: "attr-1",
                attributeName: "Color",

                offered: [
                  {
                    valueId: "val-1-3",
                    valueLabel: "Off Gray",
                  },
                ],

                comments: [
                  {
                    comment:
                      "Please update the selection to Off Gray.",
                    sender: "requester",
                    senderId: "party-01",
                  },
                  {
                    comment:
                      "We can offer only Off Gray.",
                    sender: "responder",
                    senderId: "party-02",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];