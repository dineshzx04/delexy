const rfq = [
    {
        "rfqId": "rfq-01",
        "status": "IN_PROGRESS",
        "requester_id": "party-01",
        "rfqItems": [
            {
                "id": "item-01",
                "categoryId": "cat-01",
                "quantity": 10,
                "unit": "kg",
                "requestAttributes": [
                    {
                        "id": "item-att-01",
                        "groupId": "grp-1",
                        "attributeId": "attr-1",
                        "attributeName": "Color",
                        "value": [
                            {
                                "valueId": "val-1-1",
                                "valueLable": "Dark Gray",
                                "comments": [
                                    {
                                        "comment": "I don't want black. Please give any other color option.",
                                        "sender": "requester",
                                        "senderId": "party-01"
                                    }
                                ],
                            }
                        ],
                    }
                ],
                "sellerQuote": [
                    {
                        "sellerId": "party-02",
                        "sellerQuoteAttributes": [
                            {
                                "status": "IN_NEGOTIATION",
                                "item-att-id": "item-att-01",
                                "offered": [
                                    {
                                        "valueId": "val-1-2",
                                        "valueLable": "Off Gray",
                                        "comments": [
                                            {
                                                "comment": "We can offer dark blue instead.",
                                                "sender": "responder",
                                                "senderId": "party-02"
                                            }
                                        ],
                                    }
                                ],
                            }
                        ]
                    },
                ],
                "negotiationRounds": [
                    {
                        "roundNumber": 1,
                        "attributeChangeHistory": [
                            // {
                            //     "attributeId": "attr-1",
                            //     "oldValue": "Gray",
                            //     "newValue": "Black",
                            //     "changedBy": "party-01",
                            //     "type": "REQUESTER",
                            //     "changedAt": "2022-01-01T00:00:00Z"
                            // }
                        ]
                    },
                    // {
                    //     "roundNumber": 2,
                    //     "attributeChangeHistory": [
                    //         {
                    //             "attributeId": "attr-1",
                    //             "oldValue": "Gray",
                    //             "newValue": "Black",
                    //             "changedBy": "party-01",
                    //             "type": "REQUESTER",
                    //             "changedAt": "2022-01-01T00:00:00Z"
                    //         }
                    //     ]
                    // }
                ],
            }
        ]
    }
]