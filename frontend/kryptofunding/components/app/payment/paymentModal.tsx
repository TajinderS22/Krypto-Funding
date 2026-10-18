/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Challenge } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader, Trash } from "lucide-react";
import api from "@/lib/axios";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const triggerConfettiTopRight = () => {
    confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.9, y: 0.1 },
        zIndex: 99999,
        colors: ["#22c55e", "#10b981", "#3b82f6", "#eab308", "#f97316"],
    });
};

const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(price);

type PaymentModalData = {
    setShowPaymentModal: Dispatch<SetStateAction<boolean>>;
    setIsBuying: Dispatch<SetStateAction<boolean>>;
    challenge: Challenge;
};

type PaymentApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

const getPaymentErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as PaymentApiError).response;
        const message = response?.data?.message;

        if (typeof message === "string" && message.trim().length > 0) {
            return message;
        }
    }

    return fallback;
};

const PaymentModal = ({ data }: { data: PaymentModalData }) => {
    const { setShowPaymentModal, setIsBuying, challenge } = data;
    const [disChallengeFee, setDisChallengeFee] = useState<number | undefined>(undefined);
    const [disPlatformFee, setDisPlatformFee] = useState<number | undefined>(undefined);
    const [disFinalPrice, setDisFinalPrice] = useState<number | undefined>(undefined);
    const [disGst, setDisGst] = useState<number | undefined>(undefined);
    const [disGstDiscount, setDisGstDiscoount] = useState<number | undefined>(undefined);
    const [discountApplied, setDiscountApplied] = useState(false);

    const [disMessage, setDisMessage] = useState<string | undefined>(undefined);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPaying, setIsPaying] = useState(false);

    const idempotencyKeyRef = useRef<string | null>(null);

    const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
    const discountCodeRef = useRef<HTMLInputElement>(null);
    const price = Number(challenge.price);
    const platformCharges = Number((price * 0.05).toFixed(2));
    const baseCharges = Number((price + platformCharges).toFixed(2));
    const gst = Number((baseCharges * 0.18).toFixed(2));
    const gstDiscount = -gst;

    const finalPrice = Number((price + platformCharges).toFixed(2));

    const router = useRouter();

    const [finalPaymentProcessing, setFinalPaymentProcessing] = useState(false);
    const [pendingOrderData, setPendingOrderData] = useState<any>(null);
    const [isDiscardingPending, setIsDiscardingPending] = useState(false);
    const [showCheckoutConfirmPrompt, setShowCheckoutConfirmPrompt] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const checkPendingPayment = async () => {
            try {
                const res = await api.get(`/payments/pending/${challenge.id}`);
                if (!isMounted) return;

                if (res.status === 200 && res.data?.hasPendingOrder) {
                    const orderData = res.data;
                    setPendingOrderData(orderData);
                    if (orderData.idempotencyKey) {
                        idempotencyKeyRef.current = orderData.idempotencyKey;
                    }
                    if (orderData.discountApplied) {
                        setDiscountApplied(true);
                        if (discountCodeRef.current && orderData.discountCode) {
                            discountCodeRef.current.value = orderData.discountCode;
                        }
                        if (orderData.challengeFee !== undefined) {
                            setDisChallengeFee(Number(orderData.challengeFee));
                        }
                        if (orderData.platformFee !== undefined) {
                            setDisPlatformFee(Number(orderData.platformFee));
                        }
                        if (orderData.gst !== undefined) {
                            setDisGst(Number(orderData.gst));
                        }
                        if (orderData.gstDiscount !== undefined) {
                            setDisGstDiscoount(Number(orderData.gstDiscount));
                        }
                        if (orderData.finalPrice !== undefined) {
                            setDisFinalPrice(Number(orderData.finalPrice));
                        }
                    }
                }
            } catch (err) {
                console.error("Error checking pending payment:", err);
            }
        };

        checkPendingPayment();
        return () => {
            isMounted = false;
        };
    }, [challenge.id]);

    const handleDiscardPendingOrder = async () => {
        setIsDiscardingPending(true);
        try {
            await api.delete(`/payments/pending/${challenge.id}`);
            setPendingOrderData(null);
            idempotencyKeyRef.current = null;
            setDiscountApplied(false);
            setDisChallengeFee(undefined);
            setDisPlatformFee(undefined);
            setDisGst(undefined);
            setDisGstDiscoount(undefined);
            setDisFinalPrice(undefined);
            if (discountCodeRef.current) {
                discountCodeRef.current.value = "";
            }
            toast.success("Previous pending order cancelled.");
        } catch (err) {
            console.error("Failed to cancel pending order:", err);
            toast.error("Failed to cancel pending order.");
        } finally {
            setIsDiscardingPending(false);
        }
    };

    const handleRemoveDiscountCode = async () => {
        setDisChallengeFee(undefined);
        setDisFinalPrice(undefined);
        setDisGst(undefined);
        setDisGstDiscoount(undefined);
        setDisPlatformFee(undefined);
        setDiscountApplied(false);
        if (discountCodeRef.current) {
            discountCodeRef.current.value = "";
        }
        toast.info("Discount removed");
    };

    const handleApplyDiscount = async () => {
        setIsApplyingDiscount(true);
        setErrorMessage(null);

        const tm = setTimeout(() => setIsApplyingDiscount(false), 5000);

        const discountCode = discountCodeRef.current?.value.trim();

        if (!discountCode) {
            setIsApplyingDiscount(false);
            clearTimeout(tm);
            toast.error("Please enter a discount code");
            return;
        }

        try {
            const res = await api.post("/payments/discount", {
                challengeId: challenge.id,
                discountCode: discountCode,
            });

            if (res.status === 200) {
                setIsApplyingDiscount(false);
                clearTimeout(tm);
            }

            if (!res.data.discountApplied) {
                setDiscountApplied(false);
                const msg = res.data.message || "Invalid discount code";
                setDisMessage(msg);
                toast.error(msg);
                setTimeout(() => setDisMessage(undefined), 4000);
                return;
            }

            setDisChallengeFee(res.data.challengeFee);
            setDisGst(res.data.gst);
            setDisGstDiscoount(res.data.gstDiscount);
            setDisPlatformFee(res.data.platformFee);
            setDisFinalPrice(res.data.finalPrice);
            setDiscountApplied(true);

            const successMsg = res.data.message || "Discount applied successfully!";
            setDisMessage(successMsg);
            toast.success(successMsg);
            triggerConfettiTopRight();

            setTimeout(() => {
                setDisMessage(undefined);
            }, 3000);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            const err = error.response?.data?.message || "Failed to apply discount";
            setErrorMessage(err);
            toast.error(err);
        } finally {
            setIsApplyingDiscount(false);
        }
    };

    const executeRzpPayment = async () => {
        setIsPaying(true);
        setErrorMessage(null);

        function loadScript(src: string) {
            return new Promise((resolve) => {
                const script = document.createElement("script");
                script.src = src;
                script.onload = () => {
                    resolve(true);
                };
                script.onerror = () => {
                    resolve(false);
                };
                document.body.appendChild(script);
            });
        }

        try {
            const scriptLoaded = await loadScript(
                "https://checkout.razorpay.com/v1/checkout.js",
            );
            if (!scriptLoaded || !window.Razorpay) {
                toast.error("Razorpay failed to load! Please check your connection.");
                setIsPaying(false);
                return;
            }

            if (idempotencyKeyRef.current === null) {
                idempotencyKeyRef.current = crypto.randomUUID();
            }

            const data = {
                challengeId: challenge.id,
                discountCode: discountApplied ? discountCodeRef.current?.value?.trim() : undefined,
            };

            const resOrder = await api.post("/payments/order", data, {
                headers: {
                    "idempotency-key": idempotencyKeyRef.current,
                },
            });

            const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
            if (!key) {
                throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured");
            }

            if (resOrder.status === 200) {
                const orderData = resOrder.data;

                // Sync idempotency key from database
                if (orderData.idempotencyKey) {
                    idempotencyKeyRef.current = orderData.idempotencyKey;
                }

                // Update frontend state with values from database/order
                if (orderData.discountApplied) {
                    setDiscountApplied(true);
                    if (discountCodeRef.current && orderData.discountCode) {
                        discountCodeRef.current.value = orderData.discountCode;
                    }
                    if (orderData.challengeFee !== undefined) {
                        setDisChallengeFee(Number(orderData.challengeFee));
                    }
                    if (orderData.platformFee !== undefined) {
                        setDisPlatformFee(Number(orderData.platformFee));
                    }
                    if (orderData.gst !== undefined) {
                        setDisGst(Number(orderData.gst));
                    }
                    if (orderData.gstDiscount !== undefined) {
                        setDisGstDiscoount(Number(orderData.gstDiscount));
                    }
                    if (orderData.finalPrice !== undefined) {
                        setDisFinalPrice(Number(orderData.finalPrice));
                    }
                }

                const activeIdempotencyKey =
                    orderData.idempotencyKey || idempotencyKeyRef.current;
                const frontendBaseUrl = (
                    process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin
                ).replace(/\/+$/, "");

                const options = {
                    key: key,
                    amount: orderData.amount,
                    description: "payment for KryptoFunding simulation",
                    order_id: orderData.pgOrderId,
                    callback_url: `${frontendBaseUrl}/client/dashboard/challenge/${challenge.id}`,
                    notes: {
                        idempotencyKey: activeIdempotencyKey,
                        challengeId: challenge.id,
                    },
                    modal: {
                        ondismiss: () => {
                            setIsPaying(false);
                        },
                    },
                    handler: async ({
                        razorpay_payment_id,
                        razorpay_order_id,
                        razorpay_signature,
                    }: {
                        razorpay_payment_id: string;
                        razorpay_order_id: string;
                        razorpay_signature: string;
                    }) => {
                        try {
                            setFinalPaymentProcessing(true);

                            const res = await api.post("/payments/capture", {
                                pgPaymentId: razorpay_payment_id,
                                pgOrderId: razorpay_order_id,
                                signature: razorpay_signature,
                                challengeId: challenge.id,
                                orderId: orderData.orderId,
                                discountTrackerId: orderData.discountTrackerId,
                                idempotencyKey: activeIdempotencyKey,
                            });

                            if (res.data.status == "paid") {
                                triggerConfettiTopRight();
                                toast.success("Payment Successful! Redirecting to dashboard...");

                                setTimeout(() => {
                                    router.push(`/client/dashboard/challenge/${challenge.id}/?purchase=${res.data.purchaseId}`);
                                }, 3000);
                            } else {
                                setIsBuying(false);
                                toast.error("Payment failed. Please try again.");
                            }
                        } catch (captureErr: unknown) {
                            console.error("Payment capture error:", captureErr);
                            const errMsg = getPaymentErrorMessage(
                                captureErr,
                                "Payment succeeded on Razorpay but capture failed. Please contact support.",
                            );
                            setErrorMessage(errMsg);
                            toast.error(errMsg);
                        } finally {
                            setIsPaying(false);
                        }
                    },
                };

                const pg = new window.Razorpay(options);
                pg.open();

                pg.on('payment.failed', async () => {
                    toast.error("Payment was declined or cancelled.");
                    try {
                        await api.post("/payments/capture/failed", {
                            pgOrderId: orderData.pgOrderId,
                            challengeId: challenge.id,
                        });
                    } catch (err) {
                        console.error("Error logging payment failure:", err);
                    }
                });

            }
        } catch (error: unknown) {
            console.error(error);
            const errMsg = getPaymentErrorMessage(error, "Failed to initiate payment. Please try again.");
            setErrorMessage(errMsg);
            toast.error(errMsg);
            setIsPaying(false);
        }
    };

    const handleFinalRzpPayment = async () => {
        // If user has a pending payment and applied a new discount, prompt before checkout
        if (pendingOrderData && discountApplied) {
            setShowCheckoutConfirmPrompt(true);
            return;
        }

        await executeRzpPayment();
    };

    const handleConfirmDiscardAndPay = async () => {
        setIsDiscardingPending(true);
        try {
            await api.delete(`/payments/pending/${challenge.id}`);
            setPendingOrderData(null);
            idempotencyKeyRef.current = null;
            setShowCheckoutConfirmPrompt(false);
            await executeRzpPayment();
        } catch (err) {
            console.error("Failed to cancel pending order:", err);
            toast.error("Failed to cancel previous pending order. Please try again.");
        } finally {
            setIsDiscardingPending(false);
        }
    };

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js"></Script>

            <Dialog
                open
                onOpenChange={(open) => {
                    setShowPaymentModal(open);
                    if (!open) setIsBuying(false);
                }}
            >
                <DialogContent className="max-h-[90vh] min-h-80  w-[calc(100%-2rem)] min-w-150 max-w-6xl overflow-y-auto border-gray-300 bg-white p-6 dark:border-[#3b353c] dark:bg-[#090909]/85">
                    <DialogHeader className="bg-[#c1cfc1]/0 w-[98%] rounded-lg h-fit mt-[-12] px-4 py-2">
                        <DialogTitle>Payment</DialogTitle>
                        <DialogDescription>
                            Complete your payment to start this challenge.
                        </DialogDescription>
                    </DialogHeader>

                    {errorMessage && (
                        <div className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                            {errorMessage}
                        </div>
                    )}
                    {finalPaymentProcessing ? <div>




                        <Loader size={34} className="animate-spin" />
                        <p>Please wait processing your purchase</p>

                    </div> :
                        <div>
                            {pendingOrderData && (
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300 shadow-sm backdrop-blur-sm">
                                    <div className="flex items-center gap-2.5">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                                        </span>
                                        <span>
                                            Payment pending:{" "}
                                            <strong className="text-white font-semibold">
                                                {formatPrice(pendingOrderData.finalPrice ?? finalPrice)}
                                            </strong>
                                            {pendingOrderData.discountCode ? ` (Coupon: ${pendingOrderData.discountCode})` : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleDiscardPendingOrder}
                                            disabled={isDiscardingPending}
                                            className="cursor-pointer rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                                        >
                                            {isDiscardingPending ? "Cancelling..." : "Discard Order"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-[#c1cfc1]">
                                {challenge.title}
                            </h2>
                            <div className="flex-col w-full p-2 mt-2 border border-[#83836a] rounded-lg">
                                <RowCard text={"challenge fee"} num={price} disNum={disChallengeFee} />

                                <RowCard text={"Platform charges"} num={platformCharges} disNum={disPlatformFee} />

                                <RowCard text={"G.S.T ( 18 % ) "} num={gst} disNum={disGst} />

                                <RowCard text="We're small project, can't charge gst" num={gstDiscount} disNum={disGstDiscount} />

                                <div className="mt-3 flex gap-2 items-center  p-2">
                                    <label className="mb-2 min-w-fit block text-sm font-medium text-gray-700 dark:text-[#c1cfc1]">
                                        Discount code
                                    </label>

                                    <div className="flex-1 items-center flex gap-2 justify-end" >
                                        {discountApplied && (
                                            <Trash
                                                onClick={() => handleRemoveDiscountCode()}
                                                size={30}
                                                className="cursor-pointer bg-amber-400/10 p-1 text-red-300 rounded-lg hover:bg-amber-400/20"
                                            />
                                        )}

                                        <input
                                            type="text"
                                            ref={discountCodeRef}
                                            className="w-[60%] rounded-md border uppercase border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 dark:border-[#3b353c] dark:bg-[#090909]/40 dark:text-[#c1cfc1]"
                                            placeholder="Enter code"
                                            disabled={discountApplied}
                                        />
                                    </div>
                                    <Button
                                        className="min-w-20"
                                        onClick={handleApplyDiscount}
                                        disabled={discountApplied || isApplyingDiscount}
                                    >
                                        {isApplyingDiscount ? <Loader className="animate-spin" /> : "Apply"}
                                    </Button>
                                </div>

                                {disMessage && (
                                    <p className={`text-xs px-2 mt-1 ${discountApplied ? "text-green-500" : "text-red-400"}`}>
                                        {disMessage}
                                    </p>
                                )}
                            </div>

                            <div className="flex text-xl w-full justify-between p-2 mt-4 border border-green-200/40 rounded-lg">
                                <div>Final Amount to pay</div>
                                {disFinalPrice !== undefined ? (
                                    <div className="flex gap-2" >
                                        <del>
                                            <div>{formatPrice(finalPrice)}</div>
                                        </del>
                                        <div>{formatPrice(disFinalPrice)}</div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2" >{formatPrice(finalPrice)}</div>
                                )}
                            </div>
                            {disFinalPrice === 0 && (
                                <p className="text-xs text-amber-500/90 dark:text-amber-400/90 px-1 mt-1.5">
                                    * Free challenge: A nominal ₹1 fee applies at checkout for payment gateway authorization.
                                </p>
                            )}

                            <div className="flex justify-end mt-4 ">
                                <Button
                                    className="font-bold text-xl bg-[#c1cfc1] text-black hover:bg-[#b0c0b0]"
                                    onClick={handleFinalRzpPayment}
                                    disabled={isPaying}
                                >
                                    {isPaying ? (
                                        <span className="flex items-center gap-2">
                                            <Loader className="animate-spin" size={18} /> Processing...
                                        </span>
                                    ) : pendingOrderData && !discountApplied ? (
                                        "Continue Pending Payment"
                                    ) : (
                                        "Pay Now"
                                    )}
                                </Button>
                            </div>
                        </div>
                    }
                </DialogContent>
            </Dialog>

            {showCheckoutConfirmPrompt && (
                <Dialog
                    open={showCheckoutConfirmPrompt}
                    onOpenChange={setShowCheckoutConfirmPrompt}
                >
                    <DialogContent className="max-w-md border-amber-500/30 bg-[#121212] text-white">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-amber-400">
                                <AlertCircle className="h-5 w-5 text-amber-400" />
                                Replace Pending Order?
                            </DialogTitle>
                            <DialogDescription className="text-gray-300 text-sm">
                                You have an existing unpaid order for this challenge. Proceeding with this new discount will cancel your previous pending order and create a fresh checkout session.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="my-2 rounded-lg border border-[#3b353c] bg-[#1a1a1a] p-3 text-sm space-y-2">
                            <div className="flex justify-between text-gray-400">
                                <span>Previous Pending Amount:</span>
                                <span className="font-medium text-gray-200">
                                    {formatPrice(pendingOrderData?.finalPrice ?? finalPrice)}
                                </span>
                            </div>
                            <div className="flex justify-between text-green-400 font-semibold">
                                <span>New Amount to Pay:</span>
                                <span>{formatPrice(disFinalPrice ?? finalPrice)}</span>
                            </div>
                        </div>

                        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setShowCheckoutConfirmPrompt(false)}
                                disabled={isDiscardingPending}
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            >
                                Keep Pending
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmDiscardAndPay}
                                disabled={isDiscardingPending}
                                className="bg-green-600 text-white hover:bg-green-500"
                            >
                                {isDiscardingPending ? (
                                    <span className="flex items-center gap-2">
                                        <Loader className="animate-spin" size={16} /> Updating...
                                    </span>
                                ) : (
                                    "Confirm & Pay"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

type RowCardType = {
    text: string;
    num: number;
    disNum?: number;
};

const RowCard = (props: RowCardType) => {
    const { text, num, disNum } = props;

    return (
        <div className="flex w-full justify-between p-2 border-b border-[#c1cfc1]/50 my-2">
            <div className="max-w-[50%]">{text}</div>
            {disNum !== undefined && disNum !== num ? <div className="flex gap-2"><del>{formatPrice(num)}</del> <p>{formatPrice(disNum)}</p></div> : <div>{formatPrice(num)}</div>}
        </div>
    );
};


export default PaymentModal;
